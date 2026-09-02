from __future__ import annotations

from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment / .env."""

    model_config = SettingsConfigDict(
        env_prefix="FLAMEE_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""  # anon/public key
    supabase_service_key: str = ""  # service_role key (server-side only)

    # AI
    ai_provider: Literal["openai", "anthropic"] = "openai"
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    ai_chat_model: str = "gpt-4o-mini"
    ai_timeout_seconds: int = 30

    # Security
    secret_key: str = "change-in-production-min-32-chars"
    jwt_ttl_hours: int = 24
    otp_ttl_seconds: int = 600
    invite_code_ttl_hours: int = 168

    # Upload
    max_upload_size_mb: int = 5

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    cors_origins: list[str] = ["*"]

    @property
    def is_production(self) -> bool:
        return not self.debug


settings = Settings()