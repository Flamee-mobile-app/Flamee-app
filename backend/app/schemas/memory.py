from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator

from app.core.constants import MemoryCategory
from app.models.memory import Memory, MemoryImage


def _normalize_category(value: str) -> str:
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
    mime_type: str | None
    size_bytes: int | None
    uploaded_by: str
    created_at: str
    # M-06: signed URL hết hạn (epoch seconds)
    url_expires_at: Optional[int] = None

    @classmethod
    def from_model(cls, img: MemoryImage) -> "MemoryImageResponse":
        if not img.url:
            raise RuntimeError("Memory image has no readable URL")
        return cls(
            id=img.id,
            url=img.url,
            thumbnail_url=img.thumbnail_url,
            width=img.width,
            height=img.height,
            mime_type=img.mime_type,
            size_bytes=img.size_bytes,
            uploaded_by=img.uploaded_by,
            created_at=img.created_at,
            url_expires_at=_parse_exp_to_epoch(img.url_expires_at),
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


class MemoryAuthor(BaseModel):
    id: str
    full_name: str
    username: str | None = None
    avatar_url: str | None = None


class MemoryCoverImage(BaseModel):
    id: str
    url: str
    thumbnail_url: str | None
    width: int | None
    height: int | None
    url_expires_at: int | None = None


class MemoryListItem(BaseModel):
    id: str
    title: str
    category: str
    memory_date: str
    location: str | None
    is_pinned: bool
    thumbnail_url: str | None
    image_count: int
    cover_image: MemoryCoverImage | None = None
    description: str | None = None
    created_by: str | None = None
    created_at: str | None = None
    author: MemoryAuthor | None = None
    url_expires_at: Optional[int] = None

    @classmethod
    def from_memory(
        cls, memory: Memory, images: list[MemoryImage], *, image_count: int | None = None
    ) -> "MemoryListItem":
        thumb = images[0].thumbnail_url or images[0].url if images else None
        exp = images[0].url_expires_at if images else None
        return cls(
            id=memory.id,
            title=memory.title,
            category=memory.category,
            memory_date=memory.memory_date,
            location=memory.location,
            is_pinned=memory.is_pinned,
            thumbnail_url=thumb,
            image_count=len(images) if image_count is None else image_count,
            cover_image=MemoryCoverImage(
                id=images[0].id, url=images[0].url,
                thumbnail_url=images[0].thumbnail_url,
                width=images[0].width, height=images[0].height,
                url_expires_at=_parse_exp_to_epoch(exp),
            ) if images and images[0].url else None,
            description=memory.description,
            created_by=memory.created_by,
            created_at=memory.created_at,
            url_expires_at=_parse_exp_to_epoch(exp),
        )


class MemoryListResponse(BaseModel):
    items: list[MemoryListItem]
    total: int
    limit: int = 50
    offset: int = 0
    has_more: bool = False  # M-03: cursor hint cho FE


def memory_to_response_dict(memory: Memory, images: list[MemoryImage]) -> dict[str, Any]:
    return MemoryResponse.build(memory, images).model_dump()


def _parse_exp_to_epoch(exp: str | None) -> int | None:
    if not exp:
        return None
    try:
        from datetime import datetime, timezone

        # Accept ISO format with/without tz
        e = datetime.fromisoformat(exp.replace("Z", "+00:00"))
        if e.tzinfo is None:
            e = e.replace(tzinfo=timezone.utc)
        return int(e.timestamp())
    except (ValueError, TypeError):
        return None
