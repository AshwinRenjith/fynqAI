"""Routes exposing personalised student profile insights."""

from __future__ import annotations

from functools import lru_cache

from fastapi import APIRouter, Depends, HTTPException, status

from app.models.student_profile import StudentDashboardView
from app.services.business.student_profile_service import (
    StudentProfileService,
    StudentProfileServiceError,
)

router = APIRouter(prefix="/students", tags=["student-profile"])


@lru_cache(maxsize=1)
def get_student_profile_service() -> StudentProfileService:
    """Return a cached student profile service instance."""

    return StudentProfileService()


@router.get(
    "/{user_id}/dashboard",
    response_model=StudentDashboardView,
    status_code=status.HTTP_200_OK,
)
async def fetch_student_dashboard(
    user_id: str,
    service: StudentProfileService = Depends(get_student_profile_service),
) -> StudentDashboardView:
    """Return a personalised dashboard view for the requested student."""

    try:
        return await service.get_dashboard_view(user_id)
    except StudentProfileServiceError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - unexpected errors
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to load student dashboard") from exc
