"""Perplexity provider placeholder implementing the MCP interface."""

from __future__ import annotations

from typing import Any, Dict, Iterable

from app.services.perplexity_service import PerplexityService, PerplexityServiceError
from app.utils.logger import get_logger

from .base import LLMProvider, ProviderCapability, ProviderNotAvailableError


class PerplexityProvider(LLMProvider):
    """Adapter for the Perplexity large language models."""

    def __init__(self, *, api_key: str | None = None, model: str = "sonar-pro") -> None:
        self._logger = get_logger(__name__)
        self._service: PerplexityService | None = None
        if api_key:
            try:
                self._service = PerplexityService(api_key, model=model)
            except PerplexityServiceError as exc:  # pragma: no cover - configuration errors
                self._logger.warning("Failed to initialise Perplexity provider", extra={"error": str(exc)})

    @property
    def name(self) -> str:
        return "perplexity"

    @property
    def model(self) -> str:
        return "perplexity-latest"

    @property
    def capabilities(self) -> Iterable[ProviderCapability]:
        return (
            ProviderCapability.TEXT_EXTRACTION,
            ProviderCapability.TEXT_GENERATION,
        )

    @property
    def is_available(self) -> bool:
        return self._service is not None

    async def parse_text(self, prompt: str, *, instructions: str | None = None) -> Dict[str, Any]:
        if not self._service:
            raise ProviderNotAvailableError("Perplexity provider not configured")
        template = instructions or prompt
        return await self._service.generate_json(template)

    async def parse_image(self, image_bytes: bytes, *, mime_type: str, instructions: str | None = None) -> Dict[str, Any]:
        raise ProviderNotAvailableError("Perplexity provider does not support image parsing")

    async def generate_answer(self, prompt: str, *, instructions: str | None = None) -> str:
        if not self._service:
            raise ProviderNotAvailableError("Perplexity provider not configured")
        final_prompt = instructions or prompt
        return await self._service.generate_text(final_prompt)
