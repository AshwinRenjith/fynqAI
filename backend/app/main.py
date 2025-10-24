"""FastAPI application entry point."""

from __future__ import annotations

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routes.answers import router as answers_router
from app.routes.doubts import router as doubts_router
from app.routes.student_profile import router as student_profile_router
from app.utils.logger import configure_logging, get_logger


configure_logging()
logger = get_logger(__name__)

settings = get_settings()

app = FastAPI(title=settings.app_name, debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(doubts_router)
app.include_router(answers_router)
app.include_router(student_profile_router)


@app.on_event("startup")
async def on_startup() -> None:
    """Log application startup."""

    logger.info("Application starting", extra={"environment": settings.environment})


@app.on_event("shutdown")
async def on_shutdown() -> None:
    """Log application shutdown."""

    logger.info("Application shutting down")
