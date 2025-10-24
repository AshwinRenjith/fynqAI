"""Tests for the student profile dashboard route."""

from __future__ import annotations

from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.student_profile import StudentDashboardView, SubjectInsight
from app.routes.student_profile import get_student_profile_service


class StubStudentProfileService:
    def __init__(self) -> None:
        self.calls: list[str] = []

    async def get_dashboard_view(self, user_id: str) -> StudentDashboardView:
        self.calls.append(user_id)
        return StudentDashboardView(
            user_id=user_id,
            strengths=["Geometry"],
            weaknesses=["Algebra proofs"],
            preferred_styles={"visual": 3},
            dominant_style="visual",
            subject_focus=[SubjectInsight(subject="Geometry", proficiency=0.9)],
            recent_topics=["Triangles"],
            active_streak_days=2,
            last_interaction_at=datetime.now(timezone.utc),
            alerts=["You're on a 2-day streak—keep it going!"],
        )


@pytest.fixture(name="client")
def client_fixture() -> TestClient:
    stub_service = StubStudentProfileService()

    def _service_dependency() -> StubStudentProfileService:
        return stub_service

    app.dependency_overrides[get_student_profile_service] = _service_dependency
    test_client = TestClient(app)
    test_client.stub_service = stub_service  # type: ignore[attr-defined]

    try:
        yield test_client
    finally:
        app.dependency_overrides.pop(get_student_profile_service, None)


def test_fetch_student_dashboard_returns_personalised_payload(client: TestClient) -> None:
    response = client.get("/students/user-7/dashboard")

    assert response.status_code == 200
    payload = response.json()
    assert payload["user_id"] == "user-7"
    assert payload["dominant_style"] == "visual"
    assert "Geometry" in payload["strengths"]
    assert client.stub_service.calls == ["user-7"]  # type: ignore[attr-defined]
