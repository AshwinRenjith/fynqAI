"""Redis cache service providing async helper methods."""

from __future__ import annotations

from typing import Any, Optional

import redis.asyncio as redis

from app.config import get_settings
from app.utils.logger import get_logger


class RedisService:
    """Cache operations using Redis with async/await."""

    def __init__(self, url: Optional[str] = None, *, default_ttl: int = 60 * 60 * 24 * 7) -> None:
        settings = get_settings()
        self._redis = redis.from_url(url or settings.redis_url, encoding="utf-8", decode_responses=True)
        self._default_ttl = default_ttl
        self._logger = get_logger(__name__)

    async def get(self, key: str) -> Any:
        self._logger.info("Redis GET", extra={"key": key})
        return await self._redis.get(key)

    async def set(self, key: str, value: Any, *, ttl: Optional[int] = None) -> None:
        self._logger.info("Redis SET", extra={"key": key, "ttl": ttl or self._default_ttl})
        await self._redis.set(key, value, ex=ttl or self._default_ttl)

    async def delete(self, key: str) -> None:
        self._logger.info("Redis DEL", extra={"key": key})
        await self._redis.delete(key)

    async def close(self) -> None:
        await self._redis.close()
