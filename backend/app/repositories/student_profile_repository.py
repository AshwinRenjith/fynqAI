"""Repository abstraction for persisted student personalisation profiles."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import uuid4

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
        self._memory_store: Dict[str, Dict[str, Any]] = {}

    async def get_by_user_id(self, user_id: str) -> Optional[StudentProfileRecord]:
        try:
            row = await self._service.fetch_one(self._table, user_id=user_id)
            if row:
                return StudentProfileRecord.model_validate(row)
        except Exception as exc:  # pragma: no cover - local fallback path
            self._logger.warning(
                "Supabase fetch failed, checking in-memory profiles",
                extra={"error": str(exc)},
            )

        memory = self._memory_store.get(user_id)
        if not memory:
            return None
        return StudentProfileRecord.model_validate(memory)

    async def upsert_profile(self, payload: StudentProfileCreate | StudentProfileUpdate | Dict[str, Any]) -> StudentProfileRecord:
        if isinstance(payload, (StudentProfileCreate, StudentProfileUpdate)):
            data = payload.model_dump(exclude_none=True)
        else:
            data = payload
        try:
            record = await self._service.upsert(
                self._table,
                data=data,
                conflict_column="user_id",
            )
            if not record:
                raise StudentProfileRepositoryError("Supabase did not return profile data after upsert")
            self._logger.info("Upserted student profile", extra={"user_id": data["user_id"]})
            return StudentProfileRecord.model_validate(record)
        except Exception as exc:  # pragma: no cover - local fallback path
            self._logger.warning(
                "Supabase upsert failed, storing profile in memory",
                extra={"error": str(exc)},
            )
            now = datetime.now(timezone.utc)
            record = {
                **self._memory_store.get(data["user_id"], {}),
                **data,
                "id": data.get("id") or str(uuid4()),
                "updated_at": now,
                "created_at": self._memory_store.get(data["user_id"], {}).get("created_at", now),
            }
            self._memory_store[data["user_id"]] = record
            return StudentProfileRecord.model_validate(record)
