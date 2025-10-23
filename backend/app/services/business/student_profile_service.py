"""Business logic for managing personalised student profiles."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from app.models.student_profile import StudentProfileCreate, StudentProfileRecord
from app.repositories.student_profile_repository import (
    StudentProfileRepository,
    StudentProfileRepositoryError,
)
from app.utils.logger import get_logger


class StudentProfileServiceError(RuntimeError):
    """Raised when profile enrichment fails."""


class StudentProfileService:
    """High-level API for reading and updating student personalisation features."""

    def __init__(self, repository: Optional[StudentProfileRepository] = None) -> None:
        self._repository = repository or StudentProfileRepository()
        self._logger = get_logger(__name__)

    async def get_or_create_profile(self, user_id: str) -> StudentProfileRecord:
        existing = await self._repository.get_by_user_id(user_id)
        if existing:
            return existing
        baseline = StudentProfileCreate(user_id=user_id)
        return await self._repository.upsert_profile(baseline)

    async def record_learning_event(
        self,
        *,
        user_id: str,
        subject: Optional[str],
        topic: Optional[str],
        outcome_score: float,
        explanation_style: Optional[str] = None,
    ) -> StudentProfileRecord:
        """Update the profile based on a learning interaction outcome.

        Args:
            user_id: Supabase auth identifier.
            subject: Curriculum subject label.
            topic: Topic or concept label.
            outcome_score: Normalised score in [0, 1] representing mastery.
            explanation_style: Style label that was delivered (e.g. "visual", "step_by_step").
        """

        profile = await self.get_or_create_profile(user_id)
        updated = profile.model_copy(deep=True)

        now = datetime.now(timezone.utc)
        updated.last_interaction_at = now

        if subject:
            updated.subject_proficiency[subject] = self._blend_score(
                updated.subject_proficiency.get(subject, 0.5),
                outcome_score,
            )
            self._update_strengths_and_weaknesses(updated, subject, outcome_score)

        if topic:
            updated.topic_proficiency[topic] = self._blend_score(
                updated.topic_proficiency.get(topic, 0.5),
                outcome_score,
            )
            self._update_recent_topics(updated, topic)

        if explanation_style:
            count = updated.preferred_styles.get(explanation_style, 0) + (1 if outcome_score >= 0.6 else 0)
            updated.preferred_styles[explanation_style] = count

        payload = updated.model_dump(exclude_none=True)

        try:
            result = await self._repository.upsert_profile(payload)
        except (StudentProfileRepositoryError, Exception) as exc:  # pragma: no cover - persistence failure
            self._logger.exception(
                "Failed to persist student profile",
                extra={"user_id": user_id, "subject": subject, "topic": topic},
            )
            raise StudentProfileServiceError("Failed to persist student profile") from exc

        return result

    def _update_recent_topics(self, profile: StudentProfileRecord, topic: str, limit: int = 10) -> None:
        entries = [t for t in profile.recent_topics if t != topic]
        entries.insert(0, topic)
        profile.recent_topics = entries[:limit]

    def _update_strengths_and_weaknesses(
        self,
        profile: StudentProfileRecord,
        label: str,
        outcome_score: float,
        strong_threshold: float = 0.8,
        weak_threshold: float = 0.4,
    ) -> None:
        strengths = {item for item in profile.strengths}
        weaknesses = {item for item in profile.weaknesses}

        if outcome_score >= strong_threshold:
            strengths.add(label)
            weaknesses.discard(label)
        elif outcome_score <= weak_threshold:
            weaknesses.add(label)
            strengths.discard(label)

        profile.strengths = sorted(strengths)
        profile.weaknesses = sorted(weaknesses)

    def _blend_score(self, current: float, new_score: float, weight: float = 0.3) -> float:
        current = max(0.0, min(1.0, current))
        new_score = max(0.0, min(1.0, new_score))
        blended = (1 - weight) * current + weight * new_score
        return round(blended, 4)
