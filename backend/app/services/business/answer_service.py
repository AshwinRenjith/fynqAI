"""High-level service that orchestrates answer generation for doubts."""

from __future__ import annotations

from typing import Optional

from app.core.rag.orchestrator import RAGOrchestrator, RAGOrchestrationError
from app.models.doubt import DoubtRecord
from app.models.response import ResponseRecord
from app.repositories.response_repository import ResponseRepository
from app.utils.logger import get_logger


class AnswerServiceError(RuntimeError):
    """Raised when answer generation or persistence fails."""


class AnswerService:
    """Coordinates RAG orchestrator output with persistence."""

    def __init__(
        self,
        *,
        orchestrator: Optional[RAGOrchestrator] = None,
        response_repo: Optional[ResponseRepository] = None,
    ) -> None:
        self._orchestrator = orchestrator or RAGOrchestrator()
        self._responses = response_repo or ResponseRepository()
        self._logger = get_logger(__name__)

    async def generate_and_store(self, doubt: DoubtRecord, *, force_refresh: bool = False) -> ResponseRecord:
        """Run the RAG pipeline, persist the answer, and return the stored record."""

        try:
            response_payload = await self._orchestrator.generate_answer(
                doubt,
                force_refresh=force_refresh,
            )
        except RAGOrchestrationError as exc:
            raise AnswerServiceError(str(exc)) from exc

        self._logger.info(
            "Persisting generated answer",
            extra={"doubt_id": doubt.id, "subject": doubt.subject},
        )

        record = await self._responses.create(response_payload)
        return record

    async def invalidate_cached_answer(self, doubt_id: str) -> None:
        """Clear any cached answer for the supplied doubt."""

        await self._orchestrator.invalidate_cache(doubt_id)
