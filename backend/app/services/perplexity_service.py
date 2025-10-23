"""Service wrapper for Perplexity API interactions."""

from __future__ import annotations

from typing import Any, Dict, Optional

import json
import httpx

from app.utils.logger import get_logger


class PerplexityServiceError(RuntimeError):
    """Raised when Perplexity API calls fail."""


class PerplexityService:
    """Async helper for the Perplexity chat completion API."""

    def __init__(
        self,
        api_key: Optional[str],
        *,
        model: str = "sonar-pro",
        endpoint: str = "https://api.perplexity.ai/chat/completions",
        timeout: float = 30.0,
    ) -> None:
        if not api_key:
            raise PerplexityServiceError("Perplexity API key is not configured")
        self._api_key = api_key
        self._model = model
        self._endpoint = endpoint
        self._timeout = timeout
        self._logger = get_logger(__name__)

    async def generate_json(self, prompt: str) -> Dict[str, Any]:
        """Generate a JSON object via the Perplexity chat completion endpoint."""

        payload = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": "You are an educational assistant that must reply with JSON."},
                {"role": "user", "content": prompt},
            ],
            "response_format": {"type": "json_object"},
        }
        response = await self._post(payload)
        content = self._extract_content(response)
        try:
            return json.loads(content)
        except ValueError as exc:  # pragma: no cover - validation
            raise PerplexityServiceError("Perplexity returned invalid JSON") from exc

    async def generate_text(self, prompt: str) -> str:
        payload = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": "You are an educational assistant."},
                {"role": "user", "content": prompt},
            ],
        }
        response = await self._post(payload)
        return self._extract_content(response)

    async def _post(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            res = await client.post(self._endpoint, headers=headers, json=payload)
        if res.status_code >= 400:
            self._logger.error(
                "Perplexity API error", extra={"status": res.status_code, "body": res.text[:500]}
            )
            raise PerplexityServiceError("Perplexity API call failed")
        return res.json()

    def _extract_content(self, response: Dict[str, Any]) -> str:
        choices = response.get("choices") or []
        if not choices:
            raise PerplexityServiceError("Perplexity returned no choices")
        message = choices[0].get("message", {})
        content = message.get("content")
        if isinstance(content, str) and content.strip():
            return content
        if isinstance(content, list):
            parts = [part.get("text", "") for part in content if isinstance(part, dict)]
            combined = "".join(parts).strip()
            if combined:
                return combined
        raise PerplexityServiceError("Perplexity response did not include text content")
