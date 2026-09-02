from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any


@dataclass
class Couple:
    id: str
    partner1_id: str
    partner2_id: str | None
    anniversary: str | None
    status: str
    created_at: str
    updated_at: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "Couple":
        return cls(**{k: v for k, v in d.items() if k in cls.__dataclass_fields__})


@dataclass
class InviteCode:
    id: str
    code: str
    user_id: str
    status: str
    created_at: str
    expires_at: str
    used_by: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "InviteCode":
        return cls(**{k: v for k, v in d.items() if k in cls.__dataclass_fields__})