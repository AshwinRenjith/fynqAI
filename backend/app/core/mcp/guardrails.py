"""Guardrails for MCP prompt construction and response validation."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field, ValidationError

from app.utils.logger import get_logger

_EMAIL_PATTERN = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
_PHONE_PATTERN = re.compile(r"\+?\d[\d\s().-]{7,}\d")
_ACCOUNT_PATTERN = re.compile(r"\b\d{12,19}\b")
_SSN_PATTERN = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
_AADHAAR_PATTERN = re.compile(r"\b\d{4}\s\d{4}\s\d{4}\b")
_PAN_PATTERN = re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b")

_PII_PATTERNS: tuple[tuple[str, re.Pattern[str], str], ...] = (
    ("ssn", _SSN_PATTERN, "<ssn>"),
    ("aadhaar", _AADHAAR_PATTERN, "<aadhaar>"),
    ("pan", _PAN_PATTERN, "<pan>"),
    ("account", _ACCOUNT_PATTERN, "<account>"),
    ("email", _EMAIL_PATTERN, "<email>"),
    ("phone", _PHONE_PATTERN, "<phone>"),
)


class GuardrailViolation(RuntimeError):
    """Raised when prompts or responses violate guardrail expectations."""


class ExtractionPayloadModel(BaseModel):
    """Schema used to validate structured extraction payloads."""

    question: Optional[str] = Field(default=None)
    text: Optional[str] = Field(default=None)
    subject: Optional[str] = Field(default=None)
    topic: Optional[str] = Field(default=None)
    subtopic: Optional[str] = Field(default=None)
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    entities: Optional[Dict[str, Any]] = Field(default=None)
    metadata: Optional[Dict[str, Any]] = Field(default=None)
    important_concepts: Optional[list[str]] = Field(default=None)
    hint: Optional[str] = Field(default=None)

    @property
    def normalized_question(self) -> str:
        if self.question and self.question.strip():
            return self.question.strip()
        if self.text and self.text.strip():
            return self.text.strip()
        return ""


@dataclass(frozen=True)
class PromptBundle:
    """Container for prompts supplied to providers."""

    body: str
    expect_json: bool = False


class GuardrailManager:
    """Applies prompt templates, sanitisation, and validation."""

    def __init__(self) -> None:
        self._logger = get_logger(__name__)

    def scrub_input(self, text: str) -> str:
        """Mask common PII patterns before sending to providers."""

        cleaned = text.strip()
        stats: Dict[str, int] = {}

        def _apply(pattern: re.Pattern[str], replacement: str, label: str) -> None:
            nonlocal cleaned
            cleaned, count = pattern.subn(replacement, cleaned)
            if count:
                stats[label] = stats.get(label, 0) + count

        for label, pattern, replacement in _PII_PATTERNS:
            _apply(pattern, replacement, label)

        if stats:
            self._logger.info(
                "Scrubbed PII from prompt",
                extra={
                    "pii_hits": stats,
                    "original_length": len(text),
                    "sanitized_length": len(cleaned),
                },
            )
        return cleaned

    def build_text_extraction_prompt(self, text: str) -> PromptBundle:
        template = (
            "You are an educational assistant tasked with extracting structured "
            "information from student questions. Respond ONLY with JSON encoded as "
            "an object containing: question (string), subject (string or null), topic "
            "(string or null), subtopic (string or null), confidence (float 0-1), "
            "entities (object), and metadata (object)."
            "\n\nStudent question:\n{question}"
        )
        prompt = template.format(question=text)
        return PromptBundle(body=prompt, expect_json=True)

    def build_image_extraction_prompt(self) -> PromptBundle:
        template = (
            "Examine the provided study image and extract the primary question text, "
            "subject, topic, subtopic, and any notable entities. Respond ONLY with a "
            "JSON object containing the keys: question, subject, topic, subtopic, "
            "confidence (0-1), entities, metadata."
        )
        return PromptBundle(body=template, expect_json=True)

    def build_answer_prompt(self, prompt: str) -> PromptBundle:
        sanitized = self.scrub_input(prompt)
        return PromptBundle(body=sanitized, expect_json=False)

    def validate_extraction_payload(self, provider: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        if not isinstance(payload, dict):
            self._logger.warning("Provider returned non-dict payload", extra={"provider": provider})
            raise GuardrailViolation("Extraction payload must be a JSON object")

        try:
            model = ExtractionPayloadModel.model_validate(payload)
        except ValidationError as exc:
            raise GuardrailViolation(f"Extraction payload failed schema validation: {exc}") from exc

        question = model.normalized_question
        if not question:
            raise GuardrailViolation("Extraction payload did not include a question")

        data = model.model_dump(exclude_none=True)
        data.setdefault("question", question)
        return data

    def validate_answer(self, provider: str, answer: str) -> str:
        if not isinstance(answer, str):
            raise GuardrailViolation("Answer must be textual")
        cleaned = answer.strip()
        if not cleaned:
            raise GuardrailViolation("Provider returned an empty answer")
        return cleaned

    def normalize_json_response(self, provider: str, response: str) -> Dict[str, Any]:
        try:
            return json.loads(response)
        except json.JSONDecodeError as exc:
            raise GuardrailViolation(f"Provider {provider} returned invalid JSON") from exc


_guardrails_singleton: GuardrailManager | None = None


def get_guardrail_manager() -> GuardrailManager:
    global _guardrails_singleton
    if _guardrails_singleton is None:
        _guardrails_singleton = GuardrailManager()
    return _guardrails_singleton
