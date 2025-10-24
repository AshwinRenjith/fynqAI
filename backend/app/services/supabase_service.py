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
        self._url = url or str(settings.supabase_url)
        self._key = key or settings.supabase_service_role_key
        self._client: AClient | None = None
        self._logger = get_logger(__name__)

    @property
    def client(self) -> AClient:
        """Return the underlying Supabase client."""

        if self._client is None:
            raise RuntimeError("Supabase client not initialised yet; await an operation first")
        return self._client

    async def _get_client(self) -> AClient:
        if self._client is None:
            self._client = await acreate_client(self._url, self._key)
        return self._client

    async def insert(self, table: str, data: dict[str, Any]) -> dict[str, Any]:
        self._logger.info("Inserting into Supabase", extra={"table": table})
        client = await self._get_client()
        response = await client.table(table).insert(data).execute()
        return response.data[0]

    async def fetch_one(self, table: str, **filters: Any) -> dict[str, Any] | None:
        client = await self._get_client()
        query = client.table(table).select("*").limit(1)
        for key, value in filters.items():
            query = query.eq(key, value)
        response = await query.execute()
        data = response.data
        if not data:
            return None
        return data[0]

    async def update(self, table: str, *, values: dict[str, Any], filters: dict[str, Any]) -> dict[str, Any] | None:
        client = await self._get_client()
        query = client.table(table).update(values)
        for key, value in filters.items():
            query = query.eq(key, value)
        response = await query.select("*").limit(1).execute()
        data = response.data
        if not data:
            return None
        return data[0]

    async def fetch_many(
        self,
        table: str,
        *,
        filters: Optional[dict[str, Any]] = None,
        order_by: Optional[tuple[str, bool]] = None,
    ) -> list[dict[str, Any]]:
        client = await self._get_client()
        query = client.table(table).select("*")
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        if order_by:
            column, descending = order_by
            query = query.order(column, desc=descending)
        response = await query.execute()
        return response.data or []

    async def upsert(
        self,
        table: str,
        *,
        data: dict[str, Any],
        conflict_column: str,
    ) -> dict[str, Any] | None:
        client = await self._get_client()
        query = client.table(table).upsert(data)
        query = query.eq(conflict_column, data[conflict_column]).select("*").limit(1)
        response = await query.execute()
        payload = response.data
        if not payload:
            return None
        return payload[0]

    async def rpc(self, function_name: str, params: dict[str, Any]) -> Any:
        client = await self._get_client()
        return await client.rpc(function_name, params).execute()
