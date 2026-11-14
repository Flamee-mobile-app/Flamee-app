from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any


@dataclass
class User:
    id: str
    email: str
    full_name: str
    password_hash: str | None = None
    auth_provider: str = "email"
    google_id: str | None = None
    nickname: str | None = None
    avatar_url: str | None = None
    birth_date: str | None = None
    gender: str | None = None
    couple_id: str | None = None
    fcm_token: str | None = None
    timezone: str = "Asia/Ho_Chi_Minh"
    created_at: str = ""
    updated_at: str = ""
    username: str | None = None
    avatar_storage_path: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "User":
        return cls(**{k: v for k, v in d.items() if k in cls.__dataclass_fields__})
