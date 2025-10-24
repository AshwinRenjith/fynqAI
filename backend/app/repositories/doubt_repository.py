"""Repository functions for interacting with the `doubts` table."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, ClassVar, Dict, Optional
from uuid import uuid4

from app.models.doubt import DoubtCreate, DoubtRecord
from app.services.supabase_service import SupabaseService
from app.utils.logger import get_logger


class DoubtRepository:
    """Encapsulates Supabase persistence for doubt records."""

    _GLOBAL_MEMORY_STORE: ClassVar[Dict[str, Dict[str, Any]]] = {}

    def __init__(self, service: Optional[SupabaseService] = None) -> None:
        self._service = service or SupabaseService()
        self._logger = get_logger(__name__)
        self._table = "doubts"
        self._memory_store = DoubtRepository._GLOBAL_MEMORY_STORE

    async def create(self, payload: DoubtCreate) -> DoubtRecord:
        """Insert a new doubt and return the stored record."""

        self._logger.info("Creating doubt", extra={"user_id": payload.user_id})
        data = payload.model_dump(by_alias=True)
        try:
            record = await self._service.insert(self._table, data)
            return DoubtRecord.model_validate(record)
        except Exception as exc:  # pragma: no cover - local fallback path
            self._logger.warning(
                "Supabase insert failed, storing doubt in memory",
                extra={"error": str(exc)},
            )
            record = {
                **data,
                "id": data.get("id") or str(uuid4()),
                "created_at": datetime.now(timezone.utc),
            }
            self._memory_store[record["id"]] = record
            return DoubtRecord.model_validate(record)

    async def get_by_id(self, doubt_id: str) -> Optional[DoubtRecord]:
        """Fetch a single doubt by primary key."""

        try:
            row = await self._service.fetch_one(self._table, id=doubt_id)
            if row:
                return DoubtRecord.model_validate(row)
        except Exception as exc:  # pragma: no cover - local fallback path
            self._logger.warning(
                "Supabase fetch failed, checking in-memory store",
                extra={"error": str(exc)},
            )

        memory_row = self._memory_store.get(doubt_id)
        if not memory_row:
            return None
        return DoubtRecord.model_validate(memory_row)

    async def update_status(self, doubt_id: str, status: str) -> Optional[DoubtRecord]:
        """Update the status field and return the updated record."""

        self._logger.info("Updating doubt status", extra={"doubt_id": doubt_id, "status": status})
        try:
            updated = await self._service.update(
                self._table,
                values={"status": status},
                filters={"id": doubt_id},
            )
            if updated:
                return DoubtRecord.model_validate(updated)
        except Exception as exc:  # pragma: no cover - local fallback path
            self._logger.warning(
                "Supabase update failed, updating in-memory record",
                extra={"error": str(exc)},
            )

        if doubt_id in self._memory_store:
            self._memory_store[doubt_id]["status"] = status
            return DoubtRecord.model_validate(self._memory_store[doubt_id])
        return None
