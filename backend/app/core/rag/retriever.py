"""Vector retriever backed by Supabase/pgvector."""

from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional

from app.services.supabase_service import SupabaseService
from app.utils.logger import get_logger


class RetrievalError(RuntimeError):
    """Raised when the retrieval layer cannot fetch relevant contexts."""


class VectorRetriever:
    """Perform pgvector cosine similarity search via Supabase RPC."""

    def __init__(self, supabase: Optional[SupabaseService] = None, rpc_fn: str = "match_doubts") -> None:
        self._logger = get_logger(__name__)
        self._supabase = supabase or SupabaseService()
        self._rpc_fn = rpc_fn

    async def retrieve(
        self,
        embedding: List[float],
        limit: int = 5,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Run vector similarity search using the configured RPC function."""

        if not embedding:
            raise RetrievalError("Embedding vector must not be empty")

        payload: Dict[str, Any] = {
            "query_embedding": embedding,
            "match_count": limit,
        }
        if filters:
            payload["filters"] = filters

        self._logger.info(
            "Running pgvector retrieval",
            extra={"rpc": self._rpc_fn, "limit": limit, "has_filters": bool(filters)},
        )
        response = await self._supabase.client.rpc(self._rpc_fn, payload).execute()
        data: Iterable[Dict[str, Any]] = response.data or []
        results = list(data)
        self._logger.info("Retrieved contexts", extra={"count": len(results)})
        return results
