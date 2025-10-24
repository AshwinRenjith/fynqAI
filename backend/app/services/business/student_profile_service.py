"""Business logic for managing personalised student profiles."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from app.models.student_profile import (
    StudentDashboardView,
    StudentProfileCreate,
    StudentProfileRecord,
    SubjectInsight,
)
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
        try:
            existing = await self._repository.get_by_user_id(user_id)
            if existing:
                return existing
        except Exception as exc:  # pragma: no cover - local fallback path
            self._logger.warning(
                "Falling back to in-memory profile store",
                extra={"user_id": user_id, "error": str(exc)},
            )
            return self._fallback_profile(user_id)

        baseline = StudentProfileCreate(user_id=user_id)
        try:
            return await self._repository.upsert_profile(baseline)
        except Exception as exc:  # pragma: no cover - local fallback path
            self._logger.warning(
                "Upsert failed, returning fallback profile",
                extra={"user_id": user_id, "error": str(exc)},
            )
            return self._fallback_profile(user_id)

    async def get_dashboard_view(self, user_id: str) -> StudentDashboardView:
        profile = await self.get_or_create_profile(user_id)
        return self._build_dashboard_view(profile)

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

    def _build_dashboard_view(self, profile: StudentProfileRecord) -> StudentDashboardView:
        dominant_style = None
        if profile.preferred_styles:
            dominant_style = max(profile.preferred_styles.items(), key=lambda item: item[1])[0]

        subject_focus: List[SubjectInsight] = []
        for subject, score in sorted(
            profile.subject_proficiency.items(),
            key=lambda item: item[1],
            reverse=True,
        )[:5]:
            subject_focus.append(SubjectInsight(subject=subject, proficiency=round(float(score), 3)))

        streak_days = self._compute_active_streak(profile.last_interaction_at)
        alerts = self._build_alerts(profile, streak_days)

        return StudentDashboardView(
            user_id=profile.user_id,
            strengths=list(profile.strengths),
            weaknesses=list(profile.weaknesses),
            preferred_styles=dict(profile.preferred_styles),
            dominant_style=dominant_style,
            subject_focus=subject_focus,
            recent_topics=list(profile.recent_topics),
            active_streak_days=streak_days,
            last_interaction_at=profile.last_interaction_at,
            alerts=alerts,
        )

    def _compute_active_streak(self, last_interaction: Optional[datetime]) -> int:
        if not last_interaction:
            return 0
        now = datetime.now(timezone.utc)
        delta = now.date() - last_interaction.date()
        if delta.days < 0:
            return 0
        if delta.days == 0:
            return 1
        if delta.days == 1:
            return 2
        return 0

    def _build_alerts(self, profile: StudentProfileRecord, streak_days: int) -> List[str]:
        alerts: List[str] = []
        if profile.weaknesses:
            weakest = profile.weaknesses[0]
            alerts.append(f"Let's revisit {weakest} with a focused practice set.")
        if streak_days == 0:
            alerts.append("It's been a while—resume a short study session to regain momentum.")
        elif streak_days == 1:
            alerts.append("Great job studying today! Come back tomorrow to extend your streak.")
        elif streak_days >= 2:
            alerts.append(f"You're on a {streak_days}-day streak—keep it going!")
        if profile.preferred_styles:
            style = max(profile.preferred_styles.items(), key=lambda item: item[1])[0]
            alerts.append(f"Content will lean into your preferred {style.replace('_', ' ')} explanations.")
        return alerts[:3]

    def _fallback_profile(self, user_id: str) -> StudentProfileRecord:
        now = datetime.now(timezone.utc)
        return StudentProfileRecord(
            user_id=user_id,
            strengths=[],
            weaknesses=[],
            subject_proficiency={},
            topic_proficiency={},
            preferred_styles={},
            recent_topics=[],
            last_interaction_at=None,
            metadata={},
            id=user_id,
            created_at=now,
            updated_at=now,
        )
