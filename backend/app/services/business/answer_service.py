"""High-level service that orchestrates answer generation for doubts."""

from __future__ import annotations

from typing import Optional

from app.core.rag.orchestrator import RAGOrchestrator, RAGOrchestrationError
from app.models.doubt import DoubtRecord
from app.models.response import ResponseRecord
from app.repositories.response_repository import ResponseRepository
from app.services.business.student_profile_service import (
    StudentProfileService,
    StudentProfileServiceError,
)
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
        profile_service: Optional[StudentProfileService] = None,
    ) -> None:
        self._orchestrator = orchestrator or RAGOrchestrator()
        self._responses = response_repo or ResponseRepository()
        self._profiles = profile_service or StudentProfileService()
        self._logger = get_logger(__name__)

    async def generate_and_store(self, doubt: DoubtRecord, *, force_refresh: bool = False) -> ResponseRecord:
        """Run the RAG pipeline, persist the answer, and return the stored record."""

        profile_signals = None
        try:
            profile_signals = await self._profiles.get_or_create_profile(doubt.user_id)
        except StudentProfileServiceError as exc:
            self._logger.warning(
                "Falling back to answer generation without profile",
                extra={"user_id": doubt.user_id, "error": str(exc)},
            )
        except Exception:  # pragma: no cover - unexpected persistence failures
            self._logger.exception(
                "Unexpected error fetching student profile",
                extra={"user_id": doubt.user_id},
            )

        try:
            response_payload = await self._orchestrator.generate_answer(
                doubt,
                force_refresh=force_refresh,
                profile_signals=profile_signals,
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
