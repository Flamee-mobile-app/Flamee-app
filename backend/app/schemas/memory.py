from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, field_validator

from app.core.constants import MemoryCategory
from app.models.memory import Memory, MemoryImage


def _normalize_category(value: str) -> str:
    """Accept lowercase / Title-Case / UPPER and return the canonical lowercase value."""
    if value is None:
        raise ValueError("category is required")
    cleaned = value.strip().lower().replace("-", "_").replace(" ", "_")
    valid = {m.value for m in MemoryCategory}
    if cleaned not in valid:
        raise ValueError(f"category must be one of: {sorted(valid)}")
    return cleaned


class CreateMemoryRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    category: str
    memory_date: str = Field(min_length=4, max_length=32)
    location: str | None = Field(default=None, max_length=200)
    is_pinned: bool = False
    reminder_enabled: bool = False

    @field_validator("category")
    @classmethod
    def _norm_cat(cls, v: str) -> str:
        return _normalize_category(v)


class UpdateMemoryRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    category: str | None = None
    memory_date: str | None = Field(default=None, min_length=4, max_length=32)
    location: str | None = Field(default=None, max_length=200)
    is_pinned: bool | None = None
    reminder_enabled: bool | None = None

    @field_validator("category")
    @classmethod
    def _norm_cat(cls, v: str | None) -> str | None:
        return _normalize_category(v) if v is not None else None


class MemoryImageResponse(BaseModel):
    id: str
    url: str
    thumbnail_url: str | None
    width: int | None
    height: int | None
    uploaded_by: str
    created_at: str

    @classmethod
    def from_model(cls, img: MemoryImage) -> "MemoryImageResponse":
        return cls(
            id=img.id,
            url=img.url,
            thumbnail_url=img.thumbnail_url,
            width=img.width,
            height=img.height,
            uploaded_by=img.uploaded_by,
            created_at=img.created_at,
        )


class MemoryResponse(BaseModel):
    id: str
    title: str
    description: str | None
    category: str
    memory_date: str
    location: str | None
    is_pinned: bool
    reminder_enabled: bool
    created_by: str
    created_at: str
    updated_at: str
    images: list[MemoryImageResponse] = Field(default_factory=list)

    @classmethod
    def build(
        cls, memory: Memory, images: list[MemoryImage]
    ) -> "MemoryResponse":
        return cls(
            id=memory.id,
            title=memory.title,
            description=memory.description,
            category=memory.category,
            memory_date=memory.memory_date,
            location=memory.location,
            is_pinned=memory.is_pinned,
            reminder_enabled=memory.reminder_enabled,
            created_by=memory.created_by,
            created_at=memory.created_at,
            updated_at=memory.updated_at,
            images=[MemoryImageResponse.from_model(i) for i in images],
        )


class MemoryListItem(BaseModel):
    id: str
    title: str
    category: str
    memory_date: str
    location: str | None
    is_pinned: bool
    thumbnail_url: str | None
    image_count: int

    @classmethod
    def from_memory(
        cls, memory: Memory, images: list[MemoryImage]
    ) -> "MemoryListItem":
        thumb = images[0].thumbnail_url or images[0].url if images else None
        return cls(
            id=memory.id,
            title=memory.title,
            category=memory.category,
            memory_date=memory.memory_date,
            location=memory.location,
            is_pinned=memory.is_pinned,
            thumbnail_url=thumb,
            image_count=len(images),
        )


class MemoryListResponse(BaseModel):
    items: list[MemoryListItem]
    total: int


def memory_to_response_dict(memory: Memory, images: list[MemoryImage]) -> dict[str, Any]:
    """Return a plain dict matching `MemoryResponse` for envelope-based responses."""
    return MemoryResponse.build(memory, images).model_dump()