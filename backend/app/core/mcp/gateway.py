"""Provider-agnostic gateway for MCP operations."""

from __future__ import annotations

from functools import lru_cache
from typing import Any, Dict, Iterable, Mapping, MutableMapping, Optional, Tuple

from app.config import get_settings
from app.utils.logger import get_logger

from .guardrails import GuardrailViolation, PromptBundle, get_guardrail_manager
from .providers.base import (
    CapabilityNotSupportedError,
    LLMProvider,
    ProviderCapability,
    ProviderMetadata,
    ProviderNotAvailableError,
)
from .providers.gemini import GeminiProvider
from .providers.openai import GPT5Provider
from .providers.perplexity import PerplexityProvider


class ModelGatewayError(RuntimeError):
    """Raised when the model gateway cannot fulfil a request."""


class ModelGateway:
    """Routes MCP operations to the appropriate provider based on policy."""

    def __init__(
        self,
        providers: Optional[Mapping[str, LLMProvider]] = None,
        *,
        default_provider: Optional[str] = None,
        priority: Optional[Iterable[str]] = None,
    ) -> None:
        settings = get_settings()
        self._logger = get_logger(__name__)

        constructed = providers or self._build_default_providers(settings.openai_api_key, settings.perplexity_api_key)

        self._providers: MutableMapping[str, LLMProvider] = {
            key: provider for key, provider in constructed.items() if provider.is_available
        }
        if not self._providers:
            raise ModelGatewayError("No available LLM providers configured")

        self._default_provider = default_provider or settings.default_model_provider
        if self._default_provider not in self._providers:
            self._default_provider = next(iter(self._providers.keys()))

        priority_list = list(priority or settings.model_provider_priority)
        self._priority: tuple[str, ...] = tuple(
            provider for provider in priority_list if provider in self._providers
        ) or tuple(self._providers.keys())
        self._guardrails = get_guardrail_manager()

    @property
    def metadata(self) -> Dict[str, ProviderMetadata]:
        """Expose basic information about registered providers."""

        return {
            name: ProviderMetadata(name=provider.name, model=provider.model, capabilities=provider.capabilities)
            for name, provider in self._providers.items()
        }

    async def parse_text(self, prompt: str, *, preferred: Optional[str] = None) -> Dict[str, Any]:
        sanitized = self._guardrails.scrub_input(prompt)
        bundle = self._guardrails.build_text_extraction_prompt(sanitized)
        return await self._execute_with_fallback(
            capability=ProviderCapability.TEXT_EXTRACTION,
            preferred=preferred,
            bundle=bundle,
            call=lambda provider: provider.parse_text(sanitized, instructions=bundle.body),
            post_process=self._guardrails.validate_extraction_payload,
        )

    async def parse_image(
        self,
        image_bytes: bytes,
        *,
        mime_type: str,
        preferred: Optional[str] = None,
    ) -> Dict[str, Any]:
        bundle = self._guardrails.build_image_extraction_prompt()
        return await self._execute_with_fallback(
            capability=ProviderCapability.IMAGE_EXTRACTION,
            preferred=preferred,
            bundle=bundle,
            call=lambda provider: provider.parse_image(
                image_bytes,
                mime_type=mime_type,
                instructions=bundle.body,
            ),
            post_process=self._guardrails.validate_extraction_payload,
        )

    async def generate_answer(self, prompt: str, *, preferred: Optional[str] = None) -> str:
        bundle = self._guardrails.build_answer_prompt(prompt)
        return await self._execute_with_fallback(
            capability=ProviderCapability.TEXT_GENERATION,
            preferred=preferred,
            bundle=bundle,
            call=lambda provider: provider.generate_answer(bundle.body),
            post_process=self._guardrails.validate_answer,
        )

    async def _execute_with_fallback(
        self,
        *,
        capability: ProviderCapability,
        preferred: Optional[str],
        bundle: PromptBundle,
        call,
        post_process,
    ) -> Any:
        errors: Dict[str, str] = {}
        found = False
        for name, provider in self._providers_for(capability, preferred):
            found = True
            try:
                self._logger.info(
                    "Dispatching capability",
                    extra={"provider": name, "capability": capability.value, "preferred": preferred},
                )
                raw = await call(provider)
                processed = (
                    self._guardrails.normalize_json_response(name, raw)
                    if bundle.expect_json and isinstance(raw, str)
                    else raw
                )
                result = post_process(name, processed)
                self._logger.info(
                    "Provider satisfied capability",
                    extra={"provider": name, "capability": capability.value, "preferred": preferred},
                )
                return result
            except GuardrailViolation as exc:
                errors[name] = str(exc)
                self._logger.warning(
                    "Guardrail violation during provider call",
                    extra={"provider": name, "error": str(exc)},
                )
            except (CapabilityNotSupportedError, ProviderNotAvailableError, NotImplementedError) as exc:
                errors[name] = str(exc)
                self._logger.warning(
                    "Provider rejected capability",
                    extra={"provider": name, "error": str(exc)},
                )
            except Exception as exc:  # pragma: no cover - external API issues
                errors[name] = str(exc)
                self._logger.exception(
                    "Provider invocation failed",
                    extra={"provider": name, "capability": capability.value},
                )

        if not found:
            if preferred and preferred in self._providers:
                raise CapabilityNotSupportedError(
                    f"Provider '{preferred}' does not support {capability.value}"
                )
            raise ProviderNotAvailableError(
                f"No provider available that supports {capability.value}"
            )

        self._logger.error(
            "All providers failed",
            extra={"capability": capability.value, "preferred": preferred, "errors": errors},
        )
        raise ModelGatewayError(
            f"All providers failed for capability {capability.value}: {errors}"
        )

    def _candidate_order(self, preferred: Optional[str]) -> Iterable[str]:
        if preferred:
            return (preferred,) + self._priority
        return self._priority

    def _providers_for(
        self, capability: ProviderCapability, preferred: Optional[str]
    ) -> Iterable[Tuple[str, LLMProvider]]:
        seen: set[str] = set()
        for name in self._candidate_order(preferred):
            if name in seen:
                continue
            seen.add(name)
            provider = self._providers.get(name)
            if provider is None:
                continue
            if capability not in set(provider.capabilities):
                continue
            yield name, provider

    @staticmethod
    def _build_default_providers(openai_key: Optional[str], perplexity_key: Optional[str]) -> Mapping[str, LLMProvider]:
        providers: Dict[str, LLMProvider] = {
            "gemini": GeminiProvider(),
            "gpt5": GPT5Provider(api_key=openai_key),
            "perplexity": PerplexityProvider(api_key=perplexity_key),
        }
        return providers


@lru_cache(maxsize=1)
def get_model_gateway() -> ModelGateway:
    """Return a cached model gateway instance."""

    return ModelGateway()
