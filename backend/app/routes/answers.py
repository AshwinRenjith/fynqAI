"""Routes powering answer generation and retrieval."""

from __future__ import annotations

from functools import lru_cache

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.models.response import AnswerGenerationResponse
from app.repositories.doubt_repository import DoubtRepository
from app.services.business.answer_service import AnswerService, AnswerServiceError
from app.utils.logger import get_logger

router = APIRouter(prefix="/doubts", tags=["answers"])
logger = get_logger(__name__)


@lru_cache(maxsize=1)
def get_doubt_repository() -> DoubtRepository:
    """Return a cached repository instance for doubts."""

    return DoubtRepository()


@lru_cache(maxsize=1)
def get_answer_service() -> AnswerService:
    """Return the answer service with orchestrator + persistence wiring."""

    return AnswerService()


@router.post(
    "/{doubt_id}/answer",
    response_model=AnswerGenerationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def generate_answer_for_doubt(
    doubt_id: str,
    force_refresh: bool = Query(False, description="Ignore cached answer and recompute"),
    doubts: DoubtRepository = Depends(get_doubt_repository),
    answers: AnswerService = Depends(get_answer_service),
) -> AnswerGenerationResponse:
    """Trigger the RAG pipeline for a stored doubt and persist the result."""

    doubt = await doubts.get_by_id(doubt_id)
    if not doubt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doubt not found")

    try:
        record = await answers.generate_and_store(doubt, force_refresh=force_refresh)
    except AnswerServiceError as exc:
        logger.exception("Answer generation failed", extra={"doubt_id": doubt_id})
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

    logger.info("Generated answer", extra={"doubt_id": doubt_id, "response_id": record.id})

    return AnswerGenerationResponse(
        response_id=record.id,
        doubt_id=record.doubt_id,
        response_text=record.response_text,
        explanation=record.explanation,
        reinforcement_mcq=record.reinforcement_mcq,
        confidence_score=record.confidence_score,
        estimated_time=record.estimated_time,
    )
