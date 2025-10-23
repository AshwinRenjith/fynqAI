"""GPT-5 provider placeholder implementing the MCP interface."""

from __future__ import annotations

from typing import Any, Dict, Iterable

from app.services.openai_service import OpenAIService, OpenAIServiceError
from app.utils.logger import get_logger

from .base import CapabilityNotSupportedError, LLMProvider, ProviderCapability, ProviderNotAvailableError


class GPT5Provider(LLMProvider):
    """Adapter for an upcoming GPT-5 model via the OpenAI APIs."""

    def __init__(self, *, api_key: str | None = None, model: str = "gpt-5") -> None:
        self._logger = get_logger(__name__)
        self._service: OpenAIService | None = None
        if api_key:
            try:
                self._service = OpenAIService(api_key, model=model)
            except OpenAIServiceError as exc:  # pragma: no cover - configuration errors
                self._logger.warning("Failed to initialise OpenAI provider", extra={"error": str(exc)})

    @property
    def name(self) -> str:
        return "gpt5"

    @property
    def model(self) -> str:
        return "gpt-5"

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
            raise ProviderNotAvailableError("OpenAI provider not configured")
        template = instructions or prompt
        return await self._service.generate_json(template)

    async def parse_image(self, image_bytes: bytes, *, mime_type: str, instructions: str | None = None) -> Dict[str, Any]:
        raise CapabilityNotSupportedError("GPT-5 provider does not support image parsing yet.")

    async def generate_answer(self, prompt: str, *, instructions: str | None = None) -> str:
        if not self._service:
            raise ProviderNotAvailableError("OpenAI provider not configured")
        final_prompt = instructions or prompt
        return await self._service.generate_text(final_prompt)
