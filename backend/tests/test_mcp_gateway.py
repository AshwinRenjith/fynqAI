"""Contract tests for the MCP model gateway and guardrails."""

from __future__ import annotations

import pytest

from app.core.mcp.gateway import ModelGateway, ModelGatewayError
from app.core.mcp.guardrails import GuardrailManager
from app.core.mcp.providers.base import (
    CapabilityNotSupportedError,
    LLMProvider,
    ProviderCapability,
    ProviderNotAvailableError,
)


class _BaseStubProvider(LLMProvider):
    """Minimal provider implementation for testing."""

    def __init__(self, name: str, capabilities: tuple[ProviderCapability, ...]) -> None:
        self._name = name
        self._capabilities = capabilities
        self._available = True

    @property
    def name(self) -> str:
        return self._name

    @property
    def model(self) -> str:
        return f"mock-{self._name}"

    @property
    def capabilities(self) -> tuple[ProviderCapability, ...]:
        return self._capabilities

    @property
    def is_available(self) -> bool:
        return self._available

    async def parse_text(self, prompt: str, *, instructions: str | None = None):  # pragma: no cover - overridden
        raise ProviderNotAvailableError("Not implemented")

    async def parse_image(
        self,
        image_bytes: bytes,
        *,
        mime_type: str,
        instructions: str | None = None,
    ):
        raise CapabilityNotSupportedError("Image parsing not implemented")

    async def generate_answer(self, prompt: str, *, instructions: str | None = None):  # pragma: no cover - overridden
        raise ProviderNotAvailableError("Not implemented")


class _FailingJsonProvider(_BaseStubProvider):
    def __init__(self) -> None:
        super().__init__("fail-json", (ProviderCapability.TEXT_EXTRACTION,))
        self.calls = 0
        self.last_instructions: str | None = None
        self.last_prompt: str | None = None

    async def parse_text(self, prompt: str, *, instructions: str | None = None):
        self.calls += 1
        self.last_prompt = prompt
        self.last_instructions = instructions
        return "not json"


class _SuccessfulTextProvider(_BaseStubProvider):
    def __init__(self) -> None:
        super().__init__("success-json", (ProviderCapability.TEXT_EXTRACTION,))
        self.calls = 0
        self.last_instructions: str | None = None
        self.last_prompt: str | None = None

    async def parse_text(self, prompt: str, *, instructions: str | None = None):
        self.calls += 1
        self.last_prompt = prompt
        self.last_instructions = instructions
        return {"question": "What is the derivative of sin(x)?", "confidence": 0.9}


class _EmptyAnswerProvider(_BaseStubProvider):
    def __init__(self) -> None:
        super().__init__("empty-answer", (ProviderCapability.TEXT_GENERATION,))
        self.calls = 0

    async def generate_answer(self, prompt: str, *, instructions: str | None = None):
        self.calls += 1
        return "   "


class _SuccessfulAnswerProvider(_BaseStubProvider):
    def __init__(self) -> None:
        super().__init__("success-answer", (ProviderCapability.TEXT_GENERATION,))
        self.calls = 0
        self.last_prompt: str | None = None

    async def generate_answer(self, prompt: str, *, instructions: str | None = None):
        self.calls += 1
        self.last_prompt = prompt
        return "A detailed explanation follows."


@pytest.mark.asyncio
async def test_parse_text_falls_back_when_first_provider_violates_guardrails():
    fail_provider = _FailingJsonProvider()
    success_provider = _SuccessfulTextProvider()

    gateway = ModelGateway(
        providers={"fail": fail_provider, "success": success_provider},
        default_provider="fail",
        priority=("fail", "success"),
    )

    payload = await gateway.parse_text("Please email me at student@example.com with the problem.")

    assert payload["question"] == "What is the derivative of sin(x)?"
    assert fail_provider.calls == 1
    assert success_provider.calls == 1
    assert "<email>" in (fail_provider.last_instructions or "")
    assert "<email>" in (success_provider.last_instructions or "")
    assert "<email>" in (success_provider.last_prompt or "")


@pytest.mark.asyncio
async def test_generate_answer_falls_back_when_first_provider_returns_empty():
    empty_provider = _EmptyAnswerProvider()
    success_provider = _SuccessfulAnswerProvider()

    gateway = ModelGateway(
        providers={"empty": empty_provider, "success": success_provider},
        default_provider="empty",
        priority=("empty", "success"),
    )

    answer = await gateway.generate_answer("Explain the derivative of sin(x)")

    assert answer == "A detailed explanation follows."
    assert empty_provider.calls == 1
    assert success_provider.calls == 1
    assert "Explain" in (success_provider.last_prompt or "")


def test_guardrail_scrub_masks_multiple_pii(caplog):
    manager = GuardrailManager()
    sensitive = "Contact: user@example.com, Phone: +1 202-555-0199, SSN 123-45-6789, PAN ABCDE1234F"

    with caplog.at_level("INFO"):
        cleaned = manager.scrub_input(sensitive)

    assert "<email>" in cleaned
    assert "<phone>" in cleaned
    assert "<ssn>" in cleaned
    assert "<pan>" in cleaned

    pii_logs = [record for record in caplog.records if record.message == "Scrubbed PII from prompt"]
    assert pii_logs, "Expected a scrub logging entry"
    log_record = pii_logs[-1]
    assert hasattr(log_record, "pii_hits")
    assert log_record.pii_hits["email"] == 1
    assert log_record.pii_hits["phone"] == 1
    assert log_record.pii_hits["ssn"] == 1


@pytest.mark.asyncio
async def test_all_providers_failing_raise_error():
    fail_provider = _FailingJsonProvider()
    another_fail = _FailingJsonProvider()

    gateway = ModelGateway(
        providers={"fail1": fail_provider, "fail2": another_fail},
        default_provider="fail1",
        priority=("fail1", "fail2"),
    )

    with pytest.raises(ModelGatewayError) as excinfo:
        await gateway.parse_text("Reach me at admin@example.com")

    assert "All providers failed" in str(excinfo.value)