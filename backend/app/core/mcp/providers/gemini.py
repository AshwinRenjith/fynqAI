"""Gemini implementation of the MCP provider interface."""

from __future__ import annotations

from typing import Any, Dict, Iterable

from app.services.gemini_service import GeminiService
from app.utils.logger import get_logger

from .base import LLMProvider, ProviderCapability


class GeminiProvider(LLMProvider):
    """Adapter that exposes Gemini through the LLMProvider protocol."""

    def __init__(self, service: GeminiService | None = None) -> None:
        self._service = service or GeminiService()
        self._logger = get_logger(__name__)

    @property
    def name(self) -> str:  # noqa: D401 - Protocol requirement
        return "gemini"

    @property
    def model(self) -> str:  # noqa: D401 - Protocol requirement
        return "gemini-pro"

    @property
    def capabilities(self) -> Iterable[ProviderCapability]:
        return (
            ProviderCapability.TEXT_EXTRACTION,
            ProviderCapability.IMAGE_EXTRACTION,
            ProviderCapability.TEXT_GENERATION,
        )

    @property
    def is_available(self) -> bool:
        # The underlying service validates configuration on initialisation.
        return True

    async def parse_text(self, prompt: str, *, instructions: str | None = None) -> Dict[str, Any]:
        self._logger.info("Gemini parse_text invoked")
        return await self._service.extract_from_text(prompt, instruction=instructions)

    async def parse_image(self, image_bytes: bytes, *, mime_type: str, instructions: str | None = None) -> Dict[str, Any]:
        self._logger.info("Gemini parse_image invoked", extra={"mime_type": mime_type})
        return await self._service.extract_from_image(image_bytes, mime_type=mime_type, instruction=instructions)

    async def generate_answer(self, prompt: str, *, instructions: str | None = None) -> str:
        self._logger.info("Gemini generate_answer invoked")
        final_prompt = instructions or prompt
        return await self._service.generate_answer(final_prompt)
