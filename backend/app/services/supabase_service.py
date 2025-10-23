"""Supabase client wrapper for database and storage operations."""

from __future__ import annotations

from typing import Any, Optional

from supabase import AClient, acreate_client

from app.config import get_settings
from app.utils.logger import get_logger


class SupabaseService:
    """Provides asynchronous access to Supabase PostgREST and storage APIs."""

    def __init__(self, url: Optional[str] = None, key: Optional[str] = None) -> None:
        settings = get_settings()
        self._client: AClient = acreate_client(
            url or str(settings.supabase_url),
            key or settings.supabase_service_role_key,
        )
        self._logger = get_logger(__name__)

    @property
    def client(self) -> AClient:
        """Return the underlying Supabase client."""

        return self._client

    async def insert(self, table: str, data: dict[str, Any]) -> dict[str, Any]:
        self._logger.info("Inserting into Supabase", extra={"table": table})
        response = await self._client.table(table).insert(data).execute()
        return response.data[0]

    async def fetch_one(self, table: str, **filters: Any) -> dict[str, Any] | None:
        query = self._client.table(table).select("*").limit(1)
        for key, value in filters.items():
            query = query.eq(key, value)
        response = await query.execute()
        data = response.data
        if not data:
            return None
        return data[0]
