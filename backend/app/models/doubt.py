"""Pydantic models for the doubts domain."""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field

InputType = Literal["text", "image", "multimodal"]


class DoubtBase(BaseModel):
    """Shared fields across doubt models."""

    user_id: str = Field(..., description="Supabase user identifier")
    doubt_text: str = Field(..., description="Primary doubt text extracted or submitted")
    doubt_image_url: Optional[str] = Field(None, description="Location of uploaded doubt image")
    user_additional_text: Optional[str] = Field(
        None,
        description="Additional context provided by the student alongside the main doubt",
    )
    input_type: InputType = Field(..., description="Form of the user's input")
    subject: str = Field(..., description="Detected subject for routing and context retrieval")
    topic: Optional[str] = Field(None, description="Detected topic within the subject")
    subtopic: Optional[str] = Field(None, description="Detected subtopic for more granular tagging")
    exam_type: str = Field("JEE", description="Exam stream such as JEE or NEET")
    entities: Optional[Dict[str, str]] = Field(
        default=None,
        description="Structured entities extracted from the doubt",
    )


class DoubtCreate(DoubtBase):
    """Payload used when creating a new doubt record."""

    extracted_text: Optional[str] = Field(
        None,
        description="Raw text extracted from OCR/LLM before final cleaning",
    )


class Doubt(DoubtBase):
    """Doubt model retrieved from the database."""

    id: str = Field(..., description="Primary identifier of the stored doubt")
    created_at: datetime = Field(..., description="Creation timestamp")


class DoubtRecord(Doubt):
    """Alias for stored doubt rows returned from persistence."""

    pass


class DoubtUploadResponse(BaseModel):
    """Response payload returned to the frontend after upload."""

    doubt_id: str = Field(..., description="Unique identifier for the stored doubt")
    extracted_text: str = Field(..., description="Cleaned question text extracted from input")
    subject: str = Field(..., description="Detected subject")
    topic: Optional[str] = Field(None, description="Detected topic")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score from classification")
    input_type: InputType
    entities: Optional[Dict[str, str]] = Field(None, description="Entities extracted during parsing")


class DoubtList(BaseModel):
    """Paginated list of doubts."""

    items: List[Doubt]
    total: int


__all__ = [
    "Doubt",
    "DoubtBase",
    "DoubtCreate",
    "DoubtRecord",
    "DoubtList",
    "DoubtUploadResponse",
    "InputType",
]
