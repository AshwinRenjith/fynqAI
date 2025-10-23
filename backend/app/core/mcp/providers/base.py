"""Abstract definitions for model providers used by the MCP gateway."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, Iterable, Optional, Protocol, runtime_checkable


class ProviderCapability(str, Enum):
    """Capabilities that an LLM provider may support."""

    TEXT_EXTRACTION = "text_extraction"
    IMAGE_EXTRACTION = "image_extraction"
    TEXT_GENERATION = "text_generation"


@dataclass(frozen=True)
class ProviderMetadata:
    """Lightweight details describing a provider instance."""

    name: str
    model: str
    capabilities: Iterable[ProviderCapability]


@runtime_checkable
class LLMProvider(Protocol):
    """Protocol all model providers must satisfy."""

    @property
    def name(self) -> str:
        """Machine-friendly provider identifier (e.g. 'gemini')."""

    @property
    def model(self) -> str:
        """Underlying model identifier (e.g. 'gemini-pro-vision')."""

    @property
    def capabilities(self) -> Iterable[ProviderCapability]:
        """Capabilities supported by this provider."""

    @property
    def is_available(self) -> bool:
        """Return True when the provider can serve requests."""

    async def parse_text(self, prompt: str, *, instructions: Optional[str] = None) -> Dict[str, Any]:
        """Extract structured data from plain text."""

    async def parse_image(
        self,
        image_bytes: bytes,
        *,
        mime_type: str,
        instructions: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Extract structured data from images."""

    async def generate_answer(self, prompt: str, *, instructions: Optional[str] = None) -> str:
        """Generate a free-form answer."""


class ProviderNotAvailableError(RuntimeError):
    """Raised when a provider is requested but unavailable."""


class CapabilityNotSupportedError(RuntimeError):
    """Raised when a provider lacks the requested capability."""
