from pathlib import Path
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

    # Backends
    storage_backend: Literal["mock", "sqlite", "postgres"] = "mock"
    ai_backend: Literal["mock", "openai", "anthropic"] = "mock"
    seed: bool = True

    # Security
    secret_key: str = "dev-secret-change-in-prod"
    jwt_ttl_hours: int = 24
    otp_ttl_seconds: int = 600
    invite_code_ttl_hours: int = 168

    # Storage
    mock_data_file: Path = Path("./mock/data.json")
    max_upload_size_mb: int = 5

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    cors_origins: list[str] = ["*"]


settings = Settings()