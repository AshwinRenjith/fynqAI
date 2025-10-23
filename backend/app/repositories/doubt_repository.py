"""Repository functions for interacting with the `doubts` table."""

from __future__ import annotations

from typing import Any, Dict, Optional

from app.models.doubt import DoubtCreate, DoubtRecord
from app.services.supabase_service import SupabaseService
from app.utils.logger import get_logger


class DoubtRepository:
    """Encapsulates Supabase persistence for doubt records."""

    def __init__(self, service: Optional[SupabaseService] = None) -> None:
        self._service = service or SupabaseService()
        self._logger = get_logger(__name__)
        self._table = "doubts"

    async def create(self, payload: DoubtCreate) -> DoubtRecord:
        """Insert a new doubt and return the stored record."""

        self._logger.info("Creating doubt", extra={"user_id": payload.user_id})
        record = await self._service.insert(self._table, payload.model_dump(by_alias=True))
        return DoubtRecord.model_validate(record)

    async def get_by_id(self, doubt_id: str) -> Optional[DoubtRecord]:
        """Fetch a single doubt by primary key."""

        row = await self._service.fetch_one(self._table, id=doubt_id)
        if not row:
            return None
        return DoubtRecord.model_validate(row)

    async def update_status(self, doubt_id: str, status: str) -> Optional[DoubtRecord]:
        """Update the status field and return the updated record."""

        self._logger.info("Updating doubt status", extra={"doubt_id": doubt_id, "status": status})
        response = await (
            self._service.client.table(self._table)
            .update({"status": status})
            .eq("id", doubt_id)
            .limit(1)
            .select("*")
            .execute()
        )
        data = response.data
        if not data:
            return None
        return DoubtRecord.model_validate(data[0])
