"""Tests for student profile service personalisation updates."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, Optional

import pytest

from app.models.student_profile import StudentProfileRecord
from app.services.business.student_profile_service import StudentProfileService


class StubProfileRepository:
    def __init__(self) -> None:
        self.store: Dict[str, StudentProfileRecord] = {}

    async def get_by_user_id(self, user_id: str) -> Optional[StudentProfileRecord]:
        return self.store.get(user_id)

    async def upsert_profile(self, payload):
        data = dict(payload)
        record_id = data.pop("id", None) or data["user_id"]
        created_at = data.pop("created_at", None) or datetime.now(timezone.utc)
        data.pop("updated_at", None)
        record = StudentProfileRecord(
            **data,
            id=record_id,
            created_at=created_at,
            updated_at=datetime.now(timezone.utc),
        )
        self.store[record.user_id] = record
        return record


@pytest.mark.asyncio
async def test_record_learning_event_updates_strengths_and_topics():
    repository = StubProfileRepository()
    service = StudentProfileService(repository=repository)

    result = await service.record_learning_event(
        user_id="user-1",
        subject="Mathematics",
        topic="Derivatives",
        outcome_score=0.9,
        explanation_style="step_by_step",
    )

    assert "Mathematics" in result.strengths
    assert "Derivatives" in result.recent_topics
    assert result.subject_proficiency["Mathematics"] >= 0.5
    assert result.preferred_styles["step_by_step"] == 1

    updated = await service.record_learning_event(
        user_id="user-1",
        subject="Physics",
        topic="Kinematics",
        outcome_score=0.2,
        explanation_style="visual",
    )

    assert "Physics" in updated.weaknesses
    assert "Kinematics" == updated.recent_topics[0]
    assert updated.preferred_styles.get("visual", 0) == 0


@pytest.mark.asyncio
async def test_get_or_create_profile_returns_existing():
    repository = StubProfileRepository()
    existing = StudentProfileRecord(
        user_id="user-42",
        strengths=["Chemistry"],
        weaknesses=[],
        subject_proficiency={"Chemistry": 0.8},
        topic_proficiency={},
        preferred_styles={"mnemonic": 2},
        recent_topics=["Organic"],
        last_interaction_at=datetime.now(timezone.utc),
        metadata={},
        id="user-42",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    repository.store["user-42"] = existing

    service = StudentProfileService(repository=repository)

    profile = await service.get_or_create_profile("user-42")

    assert profile is existing

    new_profile = await service.get_or_create_profile("user-99")
    assert new_profile.user_id == "user-99"
    assert new_profile.subject_proficiency == {}
    assert new_profile.recent_topics == []


@pytest.mark.asyncio
async def test_dashboard_view_includes_personalised_alerts():
    repository = StubProfileRepository()
    profile = StudentProfileRecord(
        user_id="athena",
        strengths=["Geometry"],
        weaknesses=["Algebra proofs"],
        subject_proficiency={"Geometry": 0.88, "Algebra": 0.45},
        topic_proficiency={},
        preferred_styles={"visual": 5, "mnemonic": 1},
        recent_topics=["Euclidean proofs", "Quadratic equations"],
        last_interaction_at=datetime.now(timezone.utc),
        metadata={},
        id="athena",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    repository.store["athena"] = profile

    service = StudentProfileService(repository=repository)

    dashboard = await service.get_dashboard_view("athena")

    assert dashboard.user_id == "athena"
    assert dashboard.dominant_style == "visual"
    assert dashboard.subject_focus[0].subject == "Geometry"
    assert dashboard.active_streak_days >= 1
    assert any("streak" in alert.lower() for alert in dashboard.alerts)
