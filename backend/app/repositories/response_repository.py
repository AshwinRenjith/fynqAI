"""Repository functions for interacting with the `responses` table."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import uuid4

from app.models.response import ResponseCreate, ResponseRecord
from app.services.supabase_service import SupabaseService
from app.utils.logger import get_logger


class ResponseRepository:
    """Encapsulates Supabase persistence for mentor responses."""

    def __init__(self, service: Optional[SupabaseService] = None) -> None:
        self._service = service or SupabaseService()
        self._logger = get_logger(__name__)
        self._table = "responses"
        self._memory_store: Dict[str, Dict[str, Any]] = {}

    async def create(self, payload: ResponseCreate) -> ResponseRecord:
        """Insert a new response and return the stored record."""

        self._logger.info("Creating response", extra={"doubt_id": payload.doubt_id})
        data = payload.model_dump(by_alias=True)
        try:
            record = await self._service.insert(self._table, data)
            return ResponseRecord.model_validate(record)
        except Exception as exc:  # pragma: no cover - local fallback path
            self._logger.warning(
                "Supabase insert failed, storing response in memory",
                extra={"error": str(exc)},
            )
            record = {
                **data,
                "id": data.get("id") or str(uuid4()),
                "created_at": datetime.now(timezone.utc),
            }
            self._memory_store[record["id"]] = record
            return ResponseRecord.model_validate(record)

    async def get_by_id(self, response_id: str) -> Optional[ResponseRecord]:
        """Fetch a response by primary key."""

        try:
            row = await self._service.fetch_one(self._table, id=response_id)
            if row:
                return ResponseRecord.model_validate(row)
        except Exception as exc:  # pragma: no cover - local fallback path
            self._logger.warning(
                "Supabase fetch failed, checking in-memory responses",
                extra={"error": str(exc)},
            )

        memory_row = self._memory_store.get(response_id)
        if not memory_row:
            return None
        return ResponseRecord.model_validate(memory_row)

    async def list_for_doubt(self, doubt_id: str) -> list[ResponseRecord]:
        """Return all responses associated with a given doubt."""

        try:
            rows = await self._service.fetch_many(
                self._table,
                filters={"doubt_id": doubt_id},
                order_by=("created_at", True),
            )
        except Exception as exc:  # pragma: no cover - local fallback path
            self._logger.warning(
                "Supabase list failed, using in-memory responses",
                extra={"error": str(exc)},
            )
            rows = [row for row in self._memory_store.values() if row.get("doubt_id") == doubt_id]
            rows.sort(key=lambda item: item.get("created_at", datetime.now(timezone.utc)), reverse=True)

        return [ResponseRecord.model_validate(row) for row in rows]
