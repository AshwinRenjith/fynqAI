"""Repository abstraction for persisted student personalisation profiles."""

from __future__ import annotations

from typing import Any, Dict, Optional

from app.models.student_profile import StudentProfileCreate, StudentProfileRecord, StudentProfileUpdate
from app.services.supabase_service import SupabaseService
from app.utils.logger import get_logger


class StudentProfileRepositoryError(RuntimeError):
    """Raised when profile persistence fails."""


class StudentProfileRepository:
    """Encapsulates Supabase access for student profile data."""

    def __init__(self, service: Optional[SupabaseService] = None) -> None:
        self._service = service or SupabaseService()
        self._logger = get_logger(__name__)
        self._table = "student_profiles"

    async def get_by_user_id(self, user_id: str) -> Optional[StudentProfileRecord]:
        row = await self._service.fetch_one(self._table, user_id=user_id)
        if not row:
            return None
        return StudentProfileRecord.model_validate(row)

    async def upsert_profile(self, payload: StudentProfileCreate | StudentProfileUpdate | Dict[str, Any]) -> StudentProfileRecord:
        if isinstance(payload, (StudentProfileCreate, StudentProfileUpdate)):
            data = payload.model_dump(exclude_none=True)
        else:
            data = payload
        response = (
            await self._service.client.table(self._table)
            .upsert(data)
            .select("*")
            .eq("user_id", data["user_id"])
            .limit(1)
            .execute()
        )
        if not response.data:
            raise StudentProfileRepositoryError("Supabase did not return profile data after upsert")
        record = response.data[0]
        self._logger.info("Upserted student profile", extra={"user_id": data["user_id"]})
        return StudentProfileRecord.model_validate(record)
