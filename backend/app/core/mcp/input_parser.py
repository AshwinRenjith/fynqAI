"""Input parsing utilities leveraging Gemini to extract structured data."""

from __future__ import annotations

from typing import Any, Dict, Optional

from pydantic import BaseModel, Field

from app.models.doubt import InputType
from app.services.gemini_service import GeminiService, GeminiServiceError
from app.utils.logger import bind_request_context, clear_request_context, get_logger


class InputParserError(RuntimeError):
    """Raised when input parsing fails."""


class ExtractionResult(BaseModel):
    """Structured extraction output used further down the pipeline."""

    extracted_text: str = Field(..., description="Primary question text")
    subject: Optional[str] = Field(None, description="Detected subject")
    topic: Optional[str] = Field(None, description="Detected topic")
    subtopic: Optional[str] = Field(None, description="Detected subtopic")
    input_type: InputType = Field(..., description="Original input type")
    confidence: float = Field(0.0, ge=0.0, le=1.0, description="Model confidence")
    entities: Optional[Dict[str, Any]] = Field(None, description="Structured entities extracted")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Raw payload for downstream use")


class InputParser:
    """Parse user inputs (text, image, multimodal) into structured data."""

    def __init__(self, gemini_service: Optional[GeminiService] = None) -> None:
        self._gemini = gemini_service or GeminiService()
        self._logger = get_logger(__name__)

    async def parse_image(
        self,
        image_bytes: bytes,
        *,
        mime_type: str = "image/png",
        context: Optional[Dict[str, Any]] = None,
    ) -> ExtractionResult:
        self._set_context(context)
        try:
            if mime_type not in {"image/png", "image/jpeg", "image/jpg"}:
                raise InputParserError("Unsupported image MIME type")
            payload = await self._gemini.extract_from_image(image_bytes, mime_type=mime_type)
            self._logger.info("Parsed image input", extra={"mime_type": mime_type})
            return self._build_result(payload, input_type="image", original_text=None)
        except GeminiServiceError as exc:
            raise InputParserError("Failed to parse image input") from exc
        finally:
            clear_request_context()

    async def parse_text(
        self,
        text: str,
        *,
        context: Optional[Dict[str, Any]] = None,
    ) -> ExtractionResult:
        self._set_context(context)
        try:
            cleaned = text.strip()
            if not cleaned:
                raise InputParserError("Text input cannot be empty")
            payload = await self._gemini.extract_from_text(cleaned)
            self._logger.info("Parsed text input", extra={"length": len(cleaned)})
            return self._build_result(payload, input_type="text", original_text=cleaned)
        except GeminiServiceError as exc:
            raise InputParserError("Failed to parse text input") from exc
        finally:
            clear_request_context()

    async def parse_multimodal(
        self,
        image_bytes: bytes,
        text: str,
        *,
        mime_type: str = "image/png",
        context: Optional[Dict[str, Any]] = None,
    ) -> ExtractionResult:
        self._set_context(context)
        try:
            cleaned = text.strip()
            if not cleaned:
                raise InputParserError("Text input cannot be empty")
            if mime_type not in {"image/png", "image/jpeg", "image/jpg"}:
                raise InputParserError("Unsupported image MIME type")

            image_payload = await self._gemini.extract_from_image(image_bytes, mime_type=mime_type)
            text_payload = await self._gemini.extract_from_text(cleaned)
            merged = self._merge_payloads(image_payload, text_payload)
            self._logger.info("Parsed multimodal input", extra={"mime_type": mime_type})
            return self._build_result(merged, input_type="multimodal", original_text=cleaned)
        except GeminiServiceError as exc:
            raise InputParserError("Failed to parse multimodal input") from exc
        finally:
            clear_request_context()

    def _build_result(
        self,
        payload: Dict[str, Any],
        *,
        input_type: InputType,
        original_text: Optional[str],
    ) -> ExtractionResult:
        extracted_text = (
            payload.get("question")
            or payload.get("text")
            or original_text
            or ""
        )
        confidence = float(payload.get("confidence", 0.0))
        entities = payload.get("entities")

        return ExtractionResult(
            extracted_text=extracted_text,
            subject=payload.get("subject"),
            topic=payload.get("topic"),
            subtopic=payload.get("subtopic"),
            input_type=input_type,
            confidence=confidence,
            entities=entities if isinstance(entities, dict) else None,
            metadata=payload,
        )

    def _merge_payloads(self, primary: Dict[str, Any], secondary: Dict[str, Any]) -> Dict[str, Any]:
        merged = {**primary}
        for key, value in secondary.items():
            if key not in merged or not merged[key]:
                merged[key] = value
        return merged

    def _set_context(self, context: Optional[Dict[str, Any]]) -> None:
        clear_request_context()
        if context:
            bind_request_context(**context)
