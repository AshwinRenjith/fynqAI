from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "Fynq AI Tutor Backend"
    admin_email: str = "admin@fynq.com"
    database_url: str
    supabase_url: str
    supabase_key: str
    supabase_jwt_secret: str
    gemini_api_key: str

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()