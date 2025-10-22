"""Pydantic models for generated responses."""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class ReinforcementMCQ(BaseModel):
    """Structure of reinforcement MCQ generated for the learner."""

    question: str
    options: List[str]
    correct_option: int = Field(..., ge=0, description="Index of the correct option in the options list")
    explanation: Optional[str] = None


class ResponseBase(BaseModel):
    """Shared fields for responses."""

    doubt_id: str = Field(..., description="Associated doubt identifier")
    response_text: str = Field(..., description="Primary answer text returned to the learner")
    explanation: Optional[str] = Field(None, description="Step-by-step explanation or derivation")
    reinforcement_mcq: Optional[ReinforcementMCQ] = Field(
        None,
        description="Optional MCQ for reinforcing the concept",
    )
    confidence_score: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Confidence score from validation pipeline",
    )
    estimated_time: Optional[str] = Field(
        None,
        description="Estimated time student should spend on reviewing the answer",
    )


class Response(ResponseBase):
    """Response model fetched from the database."""

    id: str = Field(..., description="Response identifier")
    created_at: datetime = Field(..., description="Creation timestamp")
    metadata: Optional[Dict[str, str]] = Field(None, description="Additional metadata for analytics")


class AnswerGenerationRequest(BaseModel):
    """Request payload for generating an answer."""

    doubt_id: str = Field(..., description="Identifier of doubt requiring an answer")


class AnswerGenerationResponse(ResponseBase):
    """Response payload after running the answer generation pipeline."""

    response_id: str = Field(..., description="Identifier of the persisted response")


class FeedbackRequest(BaseModel):
    """Feedback submission payload."""

    response_id: str
    rating: int = Field(..., ge=1, le=5)
    feedback_text: Optional[str] = None


class FeedbackResponse(BaseModel):
    """Acknowledgement of feedback submission."""

    success: bool = Field(default=True)


__all__ = [
    "AnswerGenerationRequest",
    "AnswerGenerationResponse",
    "FeedbackRequest",
    "FeedbackResponse",
    "ReinforcementMCQ",
    "Response",
    "ResponseBase",
]
