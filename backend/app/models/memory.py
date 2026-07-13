from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any


@dataclass
class Memory:
    id: str
    couple_id: str
    created_by: str
    title: str
    description: str | None
    category: str
    memory_date: str
    location: str | None
    is_pinned: bool
    reminder_enabled: bool
    created_at: str
    updated_at: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "Memory":
        return cls(**{k: v for k, v in d.items() if k in cls.__dataclass_fields__})


@dataclass
class MemoryImage:
    id: str
    memory_id: str
    url: str
    thumbnail_url: str | None
    uploaded_by: str
    width: int | None
    height: int | None
    created_at: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "MemoryImage":
        return cls(**{k: v for k, v in d.items() if k in cls.__dataclass_fields__})