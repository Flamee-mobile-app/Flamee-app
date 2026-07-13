from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any


@dataclass
class User:
    id: str
    email: str
    password_hash: str
    full_name: str
    avatar_url: str | None = None
    birth_date: str | None = None
    gender: str | None = None
    couple_id: str | None = None
    created_at: str = ""
    updated_at: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "User":
        return cls(**{k: v for k, v in d.items() if k in cls.__dataclass_fields__})