"""Subject and topic classifier backed by HuggingFace with stub fallback."""

from __future__ import annotations

import asyncio
from typing import Any, Dict, Optional, TypedDict

from transformers import pipeline

from app.config import get_settings
from app.utils.logger import get_logger


class ClassificationError(RuntimeError):
    """Raised when subject classification fails."""


class ClassificationResult(TypedDict):
    """Structured classification output consumed by downstream services."""

    subject: str
    topic: Optional[str]
    confidence: float


class SubjectClassifier:
    """Wraps a text-classification pipeline while supporting a deterministic stub."""

    def __init__(self, model_name: Optional[str] = None, use_stub: Optional[bool] = None) -> None:
        settings = get_settings()
        self._logger = get_logger(__name__)
    self._model_name = model_name or settings.subject_classifier_model_name
    self._use_stub = use_stub if use_stub is not None else settings.subject_classifier_use_stub
    self._pipeline: Optional[Any] = None
        self._keyword_map: Dict[str, Dict[str, Optional[str]]] = {
            "physics": {"subject": "Physics", "topic": "Mechanics"},
            "chemistry": {"subject": "Chemistry", "topic": "Physical Chemistry"},
            "math": {"subject": "Mathematics", "topic": "Algebra"},
            "biology": {"subject": "Biology", "topic": "Human Physiology"},
        }

        if not self._use_stub:
            try:
                self._pipeline = pipeline("text-classification", model=self._model_name, device="cpu")
                self._logger.info("Loaded subject classifier", extra={"model": self._model_name})
            except Exception as exc:  # pragma: no cover - defensive logging
                self._logger.exception(
                    "Falling back to stub classifier after pipeline load failure",
                    extra={"model": self._model_name, "error": str(exc)},
                )
                self._use_stub = True

    async def classify(self, text: str) -> ClassificationResult:
        cleaned = text.strip()
        if not cleaned:
            raise ClassificationError("Cannot classify empty text")

        if self._use_stub or self._pipeline is None:
            return self._stub_classify(cleaned)

        self._logger.info("Classifying subject", extra={"length": len(cleaned)})
        try:
            scores = await asyncio.to_thread(self._pipeline, cleaned, truncation=True, top_k=3)
        except Exception as exc:  # pragma: no cover - defensive logging
            self._logger.exception(
                "Falling back to stub classifier after inference failure",
                extra={"model": self._model_name, "error": str(exc)},
            )
            return self._stub_classify(cleaned)

        best = scores[0] if scores else None
        if not best:
            return {"subject": "General", "topic": None, "confidence": 0.0}

        label = best.get("label", "").lower()
        mapping = self._keyword_map.get(label)
        if mapping:
            subject = mapping.get("subject", "General")
            topic = mapping.get("topic")
        else:
            subject = label.title() or "General"
            topic = None

        confidence = float(best.get("score", 0.0))
        self._logger.info(
            "Classifier pipeline result",
            extra={"label": label, "subject": subject, "confidence": confidence},
        )
        return {"subject": subject, "topic": topic, "confidence": confidence}

    def _stub_classify(self, text: str) -> ClassificationResult:
        lowered = text.lower()
        self._logger.info("Using stub classifier", extra={"length": len(lowered)})
        for keyword, result in self._keyword_map.items():
            if keyword in lowered:
                return {**result, "confidence": 0.85}
        return {"subject": "General", "topic": None, "confidence": 0.5}
