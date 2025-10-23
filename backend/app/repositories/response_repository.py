"""Repository functions for interacting with the `responses` table."""

from __future__ import annotations

from typing import Any, Dict, Optional

from app.models.response import ResponseCreate, ResponseRecord
from app.services.supabase_service import SupabaseService
from app.utils.logger import get_logger


class ResponseRepository:
    """Encapsulates Supabase persistence for mentor responses."""

    def __init__(self, service: Optional[SupabaseService] = None) -> None:
        self._service = service or SupabaseService()
        self._logger = get_logger(__name__)
        self._table = "responses"

    async def create(self, payload: ResponseCreate) -> ResponseRecord:
        """Insert a new response and return the stored record."""

        self._logger.info("Creating response", extra={"doubt_id": payload.doubt_id})
        record = await self._service.insert(self._table, payload.model_dump(by_alias=True))
        return ResponseRecord.model_validate(record)

    async def get_by_id(self, response_id: str) -> Optional[ResponseRecord]:
        """Fetch a response by primary key."""

        row = await self._service.fetch_one(self._table, id=response_id)
        if not row:
            return None
        return ResponseRecord.model_validate(row)

    async def list_for_doubt(self, doubt_id: str) -> list[ResponseRecord]:
        """Return all responses associated with a given doubt."""

        response = await (
            self._service.client.table(self._table)
            .select("*")
            .eq("doubt_id", doubt_id)
            .order("created_at", desc=True)
            .execute()
        )
        return [ResponseRecord.model_validate(row) for row in response.data or []]
