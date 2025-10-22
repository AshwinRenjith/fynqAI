"""Sentence-transformer embedding helper with async-friendly APIs."""

from __future__ import annotations

import asyncio
from functools import lru_cache
from typing import Iterable, List, Sequence

from sentence_transformers import SentenceTransformer

from app.config import get_settings
from app.utils.logger import get_logger


class EmbeddingError(RuntimeError):
    """Raised when embedding generation encounters an unrecoverable error."""


class EmbeddingService:
    """Thin wrapper around SentenceTransformer with background encoding support."""

    def __init__(self, model_name: str | None = None, normalize: bool = True) -> None:
        settings = get_settings()
        self._logger = get_logger(__name__)
        self._model_name = model_name or settings.embeddings_model_name
        self._normalize = normalize
        self._logger.info("Loading sentence-transformer", extra={"model": self._model_name})
        self._model = SentenceTransformer(self._model_name)

    async def embed_texts(self, texts: Iterable[str]) -> List[List[float]]:
        """Embed a collection of texts, skipping empty strings."""

        payload = [text.strip() for text in texts if text and text.strip()]
        if not payload:
            raise EmbeddingError("No valid texts provided for embedding")

        self._logger.info("Embedding batch", extra={"count": len(payload)})
        vectors = await asyncio.to_thread(
            self._model.encode,
            payload,
            convert_to_numpy=True,
            normalize_embeddings=self._normalize,
            show_progress_bar=False,
        )
        return vectors.tolist()

    async def embed_query(self, text: str) -> List[float]:
        """Embed a single query string."""

        cleaned = text.strip()
        if not cleaned:
            raise EmbeddingError("Cannot embed empty query")

        self._logger.info("Embedding query")
        vector = await asyncio.to_thread(
            self._model.encode,
            cleaned,
            convert_to_numpy=True,
            normalize_embeddings=self._normalize,
            show_progress_bar=False,
        )
        # encode returns ndarray for str input when convert_to_numpy=True
        return vector.tolist()  # type: ignore[return-value]


@lru_cache(maxsize=2)
def get_embedding_service(model_name: str | None = None) -> EmbeddingService:
    """Return a cached embedding service instance for the requested model."""

    return EmbeddingService(model_name=model_name)
