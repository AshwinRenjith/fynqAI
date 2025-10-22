"""Answer validation service."""

from __future__ import annotations

from typing import Dict

from app.utils.logger import get_logger


class AnswerValidator:
    """Simple validator that can be extended with LLM-as-judge in future."""

    def __init__(self) -> None:
        self._logger = get_logger(__name__)

    async def validate(self, answer: str, reference: str) -> Dict[str, float]:
        self._logger.info("Validating answer")
        score = 1.0 if answer.strip() and reference.strip() else 0.0
        return {"score": score}
