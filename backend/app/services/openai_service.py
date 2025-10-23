"""Service wrapper for OpenAI GPT-5 style endpoints."""

from __future__ import annotations

import json
from typing import Any, Dict, Optional

from app.utils.logger import get_logger

try:  # pragma: no cover - optional dependency
    from openai import AsyncOpenAI
    from openai import OpenAIError
except Exception:  # pragma: no cover - openai not installed
    AsyncOpenAI = None  # type: ignore[assignment]

    class OpenAIError(Exception):
        """Fallback error when openai package is unavailable."""


class OpenAIServiceError(RuntimeError):
    """Raised when OpenAI interactions fail."""


class OpenAIService:
    """Async helper around the OpenAI responses API."""

    def __init__(
        self,
        api_key: Optional[str],
        *,
        model: str = "gpt-5",
        temperature: float = 0.2,
        max_output_tokens: int = 1024,
    ) -> None:
        if not api_key:
            raise OpenAIServiceError("OpenAI API key is not configured")
        if AsyncOpenAI is None:
            raise OpenAIServiceError("openai package is not installed")

        self._client = AsyncOpenAI(api_key=api_key)
        self._model = model
        self._temperature = temperature
        self._max_output_tokens = max_output_tokens
        self._logger = get_logger(__name__)

    async def generate_json(self, prompt: str) -> Dict[str, Any]:
        """Generate a JSON object response given an instruction."""

        response_text = await self._invoke(prompt, expect_json=True)
        try:
            return json.loads(response_text)
        except json.JSONDecodeError as exc:  # pragma: no cover - validation
            raise OpenAIServiceError("OpenAI returned invalid JSON") from exc

    async def generate_text(self, prompt: str) -> str:
        """Generate free-form text response."""

        return await self._invoke(prompt, expect_json=False)

    async def _invoke(self, prompt: str, *, expect_json: bool) -> str:
        try:
            response = await self._client.responses.create(
                model=self._model,
                input=prompt,
                temperature=self._temperature,
                max_output_tokens=self._max_output_tokens,
                response_format={"type": "json_object"} if expect_json else None,
            )
        except OpenAIError as exc:  # pragma: no cover - network error
            self._logger.error("OpenAI API call failed", extra={"error": str(exc)})
            raise OpenAIServiceError("OpenAI API call failed") from exc

        text = self._extract_text(response)
        if not text:
            raise OpenAIServiceError("OpenAI returned an empty response")
        return text

    def _extract_text(self, response: Any) -> str:
        if hasattr(response, "output_text") and response.output_text:
            return str(response.output_text)
        if hasattr(response, "output") and response.output:
            # `output` may be a list of message parts
            pieces = []
            for item in response.output:  # type: ignore[assignment]
                content = getattr(item, "content", None)
                if not content:
                    continue
                for part in content:
                    text = getattr(part, "text", None)
                    if text:
                        pieces.append(str(text))
            if pieces:
                return "".join(pieces)
        if hasattr(response, "choices"):
            choices = getattr(response, "choices")
            if choices:
                message = getattr(choices[0], "message", None)
                if message and getattr(message, "content", None):
                    return str(message.content)
        return str(response)
