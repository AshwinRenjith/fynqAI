"""Redis cache service providing async helper methods with safe fallbacks."""

from __future__ import annotations

import time
from typing import Any, Dict, Optional, Tuple
from urllib.parse import urlparse

import redis.asyncio as redis
from redis.exceptions import RedisError

from app.config import get_settings
from app.utils.logger import get_logger


class RedisService:
    """Cache operations using Redis with async/await and in-memory fallback."""

    _ALLOWED_SCHEMES = {"redis", "rediss", "unix"}

    def __init__(self, url: Optional[str] = None, *, default_ttl: int = 60 * 60 * 24 * 7) -> None:
        self._logger = get_logger(__name__)
        self._default_ttl = default_ttl
        self._memory_store: Dict[str, Tuple[Any, Optional[float]]] = {}

        settings = get_settings()
        resolved_url = self._resolve_url(url or settings.redis_url)
        self._redis = self._initialise_client(resolved_url)

    def _resolve_url(self, candidate: Optional[str]) -> str:
        if not candidate:
            self._logger.warning("Redis URL missing, falling back to local instance")
            return "redis://localhost:6379/0"

        candidate = candidate.strip()
        parsed = urlparse(candidate)
        if not parsed.scheme:
            self._logger.warning(
                "Redis URL missing scheme, defaulting to local instance",
                extra={"provided_url": candidate},
            )
            return "redis://localhost:6379/0"

        if parsed.scheme not in self._ALLOWED_SCHEMES:
            self._logger.warning(
                "Unsupported Redis scheme, defaulting to local instance",
                extra={"scheme": parsed.scheme},
            )
            return "redis://localhost:6379/0"

        return candidate

    def _initialise_client(self, redis_url: str) -> Optional[redis.Redis]:
        try:
            return redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
        except ValueError:
            self._logger.warning(
                "Redis URL rejected by client, switching to in-memory cache",
                extra={"redis_url": redis_url},
            )
        except Exception as exc:  # pragma: no cover - defensive logging
            self._logger.warning(
                "Redis initialisation failed, switching to in-memory cache",
                extra={"redis_url": redis_url, "error": str(exc)},
            )
        return None

    def _memory_get(self, key: str) -> Any:
        self._purge_expired()
        stored = self._memory_store.get(key)
        if not stored:
            return None
        value, expires_at = stored
        if expires_at and expires_at <= time.time():
            self._memory_store.pop(key, None)
            return None
        return value

    def _memory_set(self, key: str, value: Any, ttl: Optional[int]) -> None:
        expires_at = time.time() + (ttl or self._default_ttl) if ttl or self._default_ttl else None
        self._memory_store[key] = (value, expires_at)

    def _memory_delete(self, key: str) -> None:
        self._memory_store.pop(key, None)

    def _purge_expired(self) -> None:
        now = time.time()
        expired = [key for key, (_, expiry) in self._memory_store.items() if expiry and expiry <= now]
        for key in expired:
            self._memory_store.pop(key, None)

    async def get(self, key: str) -> Any:
        self._logger.info("Redis GET", extra={"key": key})
        if self._redis is None:
            return self._memory_get(key)

        try:
            return await self._redis.get(key)
        except RedisError as exc:
            self._logger.warning(
                "Redis GET failed, using in-memory cache",
                extra={"key": key, "error": str(exc)},
            )
            return self._memory_get(key)

    async def set(self, key: str, value: Any, *, ttl: Optional[int] = None) -> None:
        effective_ttl = ttl or self._default_ttl
        self._logger.info("Redis SET", extra={"key": key, "ttl": effective_ttl})

        if self._redis is None:
            self._memory_set(key, value, effective_ttl)
            return

        try:
            await self._redis.set(key, value, ex=effective_ttl)
        except RedisError as exc:
            self._logger.warning(
                "Redis SET failed, falling back to in-memory cache",
                extra={"key": key, "error": str(exc)},
            )
            self._memory_set(key, value, effective_ttl)

    async def delete(self, key: str) -> None:
        self._logger.info("Redis DEL", extra={"key": key})
        if self._redis is None:
            self._memory_delete(key)
            return

        try:
            await self._redis.delete(key)
        except RedisError as exc:
            self._logger.warning(
                "Redis DEL failed, removing from in-memory cache",
                extra={"key": key, "error": str(exc)},
            )
            self._memory_delete(key)

    async def close(self) -> None:
        if self._redis is not None:
            await self._redis.close()
