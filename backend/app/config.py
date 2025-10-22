"""Application configuration module.

Provides typed access to environment variables using Pydantic's BaseSettings.
This ensures a single source of truth for runtime configuration across the app.
"""

from functools import lru_cache
from typing import List

from pydantic import AnyHttpUrl, BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class CorsSettings(BaseModel):
    """CORS configuration for the application."""

    allow_origins: List[AnyHttpUrl] = Field(default_factory=list)
    allow_credentials: bool = True
    allow_methods: List[str] = Field(default_factory=lambda: ["*"])
    allow_headers: List[str] = Field(default_factory=lambda: ["*"])


class Settings(BaseSettings):
    """Global application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    # Core application settings
    app_name: str = Field(default="fynqAI Backend", alias="APP_NAME")
    debug: bool = Field(default=False, alias="DEBUG")
    environment: str = Field(default="development", alias="ENVIRONMENT")

    # Secrets and security
    secret_key: str = Field(alias="SECRET_KEY")

    # Third-party integratons
    gemini_api_key: str = Field(alias="GEMINI_API_KEY")

    # Supabase configuration
    supabase_url: AnyHttpUrl = Field(alias="SUPABASE_URL")
    supabase_key: str = Field(alias="SUPABASE_KEY")
    supabase_service_role_key: str = Field(alias="SUPABASE_SERVICE_ROLE_KEY")

    # Database and cache
    database_url: str = Field(alias="DATABASE_URL")
    redis_url: str = Field(alias="REDIS_URL")

    # Vector embeddings
    embeddings_model_name: str = Field(default="sentence-transformers/all-MiniLM-L6-v2", alias="EMBEDDINGS_MODEL_NAME")

    # Subject classifier configuration
    subject_classifier_model_name: str = Field(default="raag-male/kcbert-base", alias="SUBJECT_CLASSIFIER_MODEL_NAME")
    subject_classifier_use_stub: bool = Field(default=False, alias="SUBJECT_CLASSIFIER_USE_STUB")

    # Rate limiting / throttling
    rate_limit: str = Field(default="60/minute", alias="RATE_LIMIT")

    # CORS configuration
    cors_origins: List[str] = Field(default_factory=lambda: ["http://localhost:3000"], alias="CORS_ORIGINS")

    @property
    def cors(self) -> CorsSettings:
        """Return CORS settings as a structured object."""

        origins: List[AnyHttpUrl] = []
        for origin in self.cors_origins:
            origins.append(AnyHttpUrl(origin))
        return CorsSettings(allow_origins=origins)


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance to avoid re-parsing environment variables."""

    return Settings()
