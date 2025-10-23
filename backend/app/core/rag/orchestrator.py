"""RAG orchestration utilities combining retrieval, generation, and caching."""

from __future__ import annotations

import math
from typing import Any, Dict, Iterable, List, Optional, Sequence

from pydantic import ValidationError

from app.core.mcp.gateway import ModelGateway, ModelGatewayError, get_model_gateway
from app.core.mcp.providers import CapabilityNotSupportedError, ProviderNotAvailableError
from app.core.rag.embeddings import EmbeddingError, EmbeddingService, get_embedding_service
from app.core.rag.retriever import RetrievalError, VectorRetriever
from app.models.doubt import DoubtRecord
from app.models.response import ResponseCreate
from app.services.redis_service import RedisService
from app.utils.logger import get_logger


class RAGOrchestrationError(RuntimeError):
    """Raised when the RAG pipeline cannot produce an answer."""


class RAGOrchestrator:
    """Coordinates embeddings, retrieval, generation, and caching for answers."""

    def __init__(
        self,
        *,
        model_gateway: Optional[ModelGateway] = None,
        embeddings: Optional[EmbeddingService] = None,
        retriever: Optional[VectorRetriever] = None,
        cache: Optional[RedisService] = None,
        top_k: int = 3,
        cache_ttl: int = 60 * 15,
        preferred_provider: Optional[str] = None,
    ) -> None:
        self._gateway = model_gateway or get_model_gateway()
        self._preferred_provider = preferred_provider
        self._embeddings = embeddings or get_embedding_service()
        self._retriever = retriever or VectorRetriever()
        self._cache = cache or RedisService()
        self._top_k = max(top_k, 1)
        self._cache_ttl = cache_ttl
        self._logger = get_logger(__name__)

    async def generate_answer(
        self,
        doubt: DoubtRecord,
        *,
        force_refresh: bool = False,
        extra_contexts: Optional[Sequence[Dict[str, Any]]] = None,
    ) -> ResponseCreate:
        """Return an answer for the supplied doubt, optionally using cached output."""

        cache_key = self._cache_key(doubt.id)
        if not force_refresh:
            cached = await self._try_get_cached(cache_key)
            if cached:
                self._logger.info("Returning cached RAG answer", extra={"doubt_id": doubt.id})
                return cached

        contexts = list(extra_contexts) if extra_contexts else await self._retrieve_contexts(doubt)
        ranked_contexts = self._rank_contexts(contexts)
        prompt = self._build_prompt(doubt, ranked_contexts)

        try:
            answer_text = await self._gateway.generate_answer(
                prompt,
                preferred=self._preferred_provider,
            )
        except (
            ModelGatewayError,
            ProviderNotAvailableError,
            CapabilityNotSupportedError,
            NotImplementedError,
        ) as exc:
            self._logger.exception("Model gateway answer generation failed", extra={"doubt_id": doubt.id})
            raise RAGOrchestrationError("Failed to generate answer") from exc

        metadata: Dict[str, Any] = {
            "context_ids": [self._context_identifier(ctx) for ctx in ranked_contexts],
            "context_count": len(ranked_contexts),
            "subject": doubt.subject,
        }

        response = ResponseCreate(
            doubt_id=doubt.id,
            response_text=answer_text,
            explanation=None,
            reinforcement_mcq=None,
            confidence_score=None,
            estimated_time=None,
            metadata=metadata,
        )

        await self._write_cache(cache_key, response)
        return response

    async def invalidate_cache(self, doubt_id: str) -> None:
        """Invalidate any cached answer for the supplied doubt."""

        await self._cache.delete(self._cache_key(doubt_id))

    async def _try_get_cached(self, cache_key: str) -> Optional[ResponseCreate]:
        cached = await self._cache.get(cache_key)
        if not cached:
            return None
        try:
            return ResponseCreate.model_validate_json(cached)
        except ValidationError:
            await self._cache.delete(cache_key)
            return None

    async def _write_cache(self, cache_key: str, payload: ResponseCreate) -> None:
        await self._cache.set(cache_key, payload.model_dump_json(), ttl=self._cache_ttl)

    async def _retrieve_contexts(self, doubt: DoubtRecord) -> List[Dict[str, Any]]:
        if not doubt.doubt_text:
            raise RAGOrchestrationError("Doubt text is required for retrieval")

        try:
            embedding = await self._embeddings.embed_query(doubt.doubt_text)
        except EmbeddingError as exc:
            raise RAGOrchestrationError("Failed to embed doubt text") from exc

        filters: Optional[Dict[str, Any]] = {"subject": doubt.subject} if doubt.subject else None

        try:
            contexts = await self._retriever.retrieve(embedding, filters=filters)
        except RetrievalError as exc:
            raise RAGOrchestrationError("Failed to retrieve supporting contexts") from exc

        self._logger.info(
            "Retrieved contexts for RAG",
            extra={"doubt_id": doubt.id, "count": len(contexts)},
        )
        return contexts

    def _rank_contexts(self, contexts: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not contexts:
            return []

        ranked: List[Dict[str, Any]] = []
        seen_ids: set[str] = set()

        for context in contexts:
            identifier = self._context_identifier(context)
            if identifier in seen_ids:
                continue
            seen_ids.add(identifier)
            score = self._extract_score(context)
            enriched = dict(context)
            enriched["relevance_score"] = score
            ranked.append(enriched)

        ranked.sort(key=lambda item: item.get("relevance_score", 0.0), reverse=True)
        return ranked[: self._top_k]

    def _extract_score(self, context: Dict[str, Any]) -> float:
        for key in ("score", "similarity", "match_score", "relevance"):
            value = context.get(key)
            if isinstance(value, (int, float)) and not math.isnan(value):
                return float(value)

        distance = context.get("distance")
        if isinstance(distance, (int, float)) and distance >= 0:
            return 1.0 / (1.0 + float(distance))

        rank = context.get("rank")
        if isinstance(rank, (int, float)) and rank > 0:
            return 1.0 / float(rank)

        return 0.0

    def _context_identifier(self, context: Dict[str, Any]) -> str:
        for key in ("id", "document_id", "chunk_id", "uuid"):
            if key in context and context[key] is not None:
                return str(context[key])
        try:
            return str(abs(hash(repr(sorted(context.items())))))
        except TypeError:
            return str(abs(hash(repr(context))))

    def _build_prompt(self, doubt: DoubtRecord, contexts: Sequence[Dict[str, Any]]) -> str:
        context_blocks = []
        for idx, ctx in enumerate(contexts, start=1):
            snippet = self._context_snippet(ctx)
            context_blocks.append(
                f"Context {idx} (score: {ctx.get('relevance_score', 0.0):.2f}):\n{snippet}"
            )

        context_section = "\n\n".join(context_blocks) if context_blocks else "No high-confidence external context available."

        additional = doubt.user_additional_text or "No additional context supplied."
        exam = doubt.exam_type or "Unknown exam"
        topic = doubt.topic or "General"

        return (
            "You are an expert tutor providing detailed, step-by-step explanations. "
            "Use the retrieved references when they are relevant, but do not fabricate facts.\n\n"
            f"Learner question: {doubt.doubt_text}\n"
            f"Subject: {doubt.subject} | Topic: {topic} | Exam: {exam}\n"
            f"Additional student notes: {additional}\n\n"
            "Retrieved context:\n"
            f"{context_section}\n\n"
            "Compose a thorough answer, highlight key formulas, and suggest the next learning step."
        )

    def _context_snippet(self, context: Dict[str, Any]) -> str:
        for key in ("content", "text", "chunk", "body", "summary"):
            value = context.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
        return "Context payload did not include text."

    def _cache_key(self, doubt_id: str) -> str:
        return f"rag:answer:{doubt_id}"


__all__ = ["RAGOrchestrator", "RAGOrchestrationError"]
