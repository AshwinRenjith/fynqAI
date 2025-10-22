"""Application logging utilities.

Configures structured JSON logging across the application, with support for
request-scoped context. The logger is configured once and reused everywhere.
"""

from __future__ import annotations

import json
import logging
import sys
from contextvars import ContextVar
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel


_LOGGING_INITIALIZED = False

request_context: ContextVar[Dict[str, Any]] = ContextVar("request_context", default={})


class LogRecordModel(BaseModel):
    """Schema for log records to ensure consistent structure."""

    timestamp: str
    level: str
    logger: str
    message: str
    context: Dict[str, Any]


class JsonFormatter(logging.Formatter):
    """Format log records as JSON using the schema above."""

    def format(self, record: logging.LogRecord) -> str:  # noqa: D401 - Inherit doc
        context = request_context.get().copy()
        if extra := getattr(record, "extra", None):
            context.update(extra)

        payload = LogRecordModel(
            timestamp=datetime.utcfromtimestamp(record.created).isoformat() + "Z",
            level=record.levelname,
            logger=record.name,
            message=record.getMessage(),
            context=context,
        )
        return json.dumps(payload.model_dump(mode="json"), ensure_ascii=False)


def configure_logging(level: int = logging.INFO) -> None:
    """Configure the root logger for structured JSON output.

    Parameters
    ----------
    level:
        Logging level to configure for the root logger. Defaults to ``logging.INFO``.
    """

    global _LOGGING_INITIALIZED

    if _LOGGING_INITIALIZED:
        return

    handler = logging.StreamHandler(stream=sys.stdout)
    handler.setFormatter(JsonFormatter())

    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.handlers.clear()
    root_logger.addHandler(handler)

    # Silence noisy libraries by default
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)

    _LOGGING_INITIALIZED = True


def bind_request_context(**kwargs: Any) -> None:
    """Attach contextual data to subsequent log statements within a request."""

    current = request_context.get().copy()
    current.update(kwargs)
    request_context.set(current)


def clear_request_context() -> None:
    """Clear any request-scoped context variables."""

    request_context.set({})


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """Return a module-level logger with the provided name."""

    return logging.getLogger(name or __name__)
