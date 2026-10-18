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
    ai_provider: Literal["openai", "gemini"] = "openai"
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com"
    anthropic_api_key: str = ""
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"
    gemini_base_url: str = "https://generativelanguage.googleapis.com"
    ai_chat_model: str = "gpt-4o-mini"
    ai_embed_model: str = "text-embedding-3-small"
    ai_timeout_seconds: int = 30
    
    # External APIs
    google_maps_api_key: str = ""

    # Security
    secret_key: str = "change-in-production-min-32-chars"
    jwt_ttl_hours: int = 24
    jwt_refresh_ttl_days: int = 30
    google_oauth_client_id: str = ""
    payment_webhook_secret: str = ""
    otp_ttl_seconds: int = 600
    invite_code_ttl_hours: int = 72

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

    def assert_production_safe(self) -> None:
        """Reject unsafe production credentials before serving requests."""
        if not self.is_production:
            return
        if (
            self.secret_key == type(self).model_fields["secret_key"].default
            or len(self.secret_key.strip()) < 32
        ):
            raise ValueError(
                "FLAMEE_SECRET_KEY must be non-default and at least 32 characters in production"
            )
        if not self.google_oauth_client_id.strip():
            raise ValueError("FLAMEE_GOOGLE_OAUTH_CLIENT_ID is required in production")


settings = Settings()
