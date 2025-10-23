"""Integration-style tests for the answer generation route."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.doubt import DoubtRecord
from app.models.response import ResponseRecord
from app.routes.answers import get_answer_service, get_doubt_repository


class StubDoubtRepository:
    """Provides a static doubt record for testing."""

    def __init__(self) -> None:
        self._record = DoubtRecord(
            id="doubt-123",
            user_id="user-1",
            doubt_text="What is the derivative of sin(x)?",
            doubt_image_url=None,
            user_additional_text=None,
            input_type="text",
            subject="Mathematics",
            topic="Calculus",
            subtopic="Derivatives",
            exam_type="JEE",
            entities=None,
            extracted_text="What is the derivative of sin(x)?",
            created_at=datetime.now(timezone.utc),
        )

    async def get_by_id(self, doubt_id: str) -> DoubtRecord | None:  # noqa: D401 - required signature
        return self._record if doubt_id == self._record.id else None


class StubAnswerService:
    """Records invocations for cache refresh behaviour and returns static answers."""

    def __init__(self) -> None:
        self.calls: List[bool] = []

    async def generate_and_store(self, doubt: DoubtRecord, *, force_refresh: bool = False) -> ResponseRecord:
        self.calls.append(force_refresh)
        return ResponseRecord(
            id="resp-1",
            doubt_id=doubt.id,
            response_text="The derivative of sin(x) is cos(x).",
            explanation="Differentiate sin(x) to obtain cos(x).",
            reinforcement_mcq=None,
            confidence_score=0.95,
            estimated_time="2 mins",
            created_at=datetime.now(timezone.utc),
            metadata={"source": "test"},
        )


@pytest.fixture(name="client")
def client_fixture() -> TestClient:
    stub_repo = StubDoubtRepository()
    stub_service = StubAnswerService()

    async def _repo_dependency() -> StubDoubtRepository:
        return stub_repo

    def _service_dependency() -> StubAnswerService:
        return stub_service

    app.dependency_overrides[get_doubt_repository] = _repo_dependency
    app.dependency_overrides[get_answer_service] = _service_dependency

    test_client = TestClient(app)
    test_client.stub_service = stub_service  # type: ignore[attr-defined]

    try:
        yield test_client
    finally:
        app.dependency_overrides.pop(get_doubt_repository, None)
        app.dependency_overrides.pop(get_answer_service, None)


def test_generate_answer_uses_cache_by_default(client: TestClient) -> None:
    response = client.post("/doubts/doubt-123/answer")

    assert response.status_code == 201
    data = response.json()
    assert data["doubt_id"] == "doubt-123"
    assert client.stub_service.calls == [False]  # type: ignore[attr-defined]


def test_generate_answer_with_force_refresh(client: TestClient) -> None:
    response = client.post("/doubts/doubt-123/answer", params={"force_refresh": "true"})

    assert response.status_code == 201
    assert client.stub_service.calls[-1] is True  # type: ignore[attr-defined]