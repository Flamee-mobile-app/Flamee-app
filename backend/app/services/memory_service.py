from __future__ import annotations

import base64

from fastapi import UploadFile

from app.config import settings
from app.core.constants import MemoryCategory
from app.core.exceptions import NotFoundError, ValidationError
from app.models.memory import Memory, MemoryImage
from app.repositories.memory_repo import (
    MemoryImageRepository,
    MemoryRepository,
)
from app.schemas.memory import (
    CreateMemoryRequest,
    MemoryListItem,
    UpdateMemoryRequest,
)
from app.storage.base import Storage
from app.utils.ids import generate_uuid
from app.utils.time import now_utc, to_iso


class MemoryService:
    """Memory CRUD + image upload over the Storage abstraction."""

    def __init__(
        self,
        storage: Storage,
        memory_repo: MemoryRepository,
        image_repo: MemoryImageRepository,
    ) -> None:
        self.storage = storage
        self.memory_repo = memory_repo
        self.image_repo = image_repo

    def create_memory(
        self,
        user_id: str,
        couple_id: str,
        payload: CreateMemoryRequest,
    ) -> Memory:
        now_iso = to_iso(now_utc())
        return self.memory_repo.create(
            id=generate_uuid(),
            couple_id=couple_id,
            created_by=user_id,
            title=payload.title,
            description=payload.description,
            category=payload.category,
            memory_date=payload.memory_date,
            location=payload.location,
            is_pinned=payload.is_pinned,
            reminder_enabled=payload.reminder_enabled,
            created_at=now_iso,
            updated_at=now_iso,
        )

    def list_memories(
        self,
        couple_id: str,
        *,
        category: str | None = None,
        year: int | None = None,
    ) -> tuple[list[MemoryListItem], int]:
        if category:
            valid = {m.value for m in MemoryCategory}
            if category not in valid:
                raise ValidationError(
                    f"category must be one of: {sorted(valid)}"
                )
        memories = self.memory_repo.find_by_couple(
            couple_id, category=category, year=year
        )
        items: list[MemoryListItem] = []
        for memory in memories:
            images = self.image_repo.find_by_memory(memory.id)
            items.append(MemoryListItem.from_memory(memory, images))
        return items, len(items)

    def get_memory(
        self, couple_id: str, memory_id: str
    ) -> tuple[Memory, list[MemoryImage]]:
        memory = self.memory_repo.get(memory_id)
        if not memory or memory.couple_id != couple_id:
            raise NotFoundError("Memory không tồn tại")
        images = self.image_repo.find_by_memory(memory.id)
        return memory, images

    def update_memory(
        self,
        couple_id: str,
        memory_id: str,
        payload: UpdateMemoryRequest,
    ) -> Memory:
        memory = self.memory_repo.get(memory_id)
        if not memory or memory.couple_id != couple_id:
            raise NotFoundError("Memory không tồn tại")
        patch = payload.model_dump(exclude_unset=True)
        patch["updated_at"] = to_iso(now_utc())
        return self.memory_repo.update(memory_id, **patch)

    def delete_memory(self, couple_id: str, memory_id: str) -> None:
        memory = self.memory_repo.get(memory_id)
        if not memory or memory.couple_id != couple_id:
            raise NotFoundError("Memory không tồn tại")
        self.image_repo.delete_by_memory(memory_id)
        self.memory_repo.delete(memory_id)

    def upload_image(
        self,
        user_id: str,
        couple_id: str,
        memory_id: str,
        file: UploadFile,
    ) -> MemoryImage:
        memory = self.memory_repo.get(memory_id)
        if not memory or memory.couple_id != couple_id:
            raise NotFoundError("Memory không tồn tại")
        content = self._read_within_limit(file)
        url = self._to_data_url(file, content)
        return self.image_repo.create(
            id=generate_uuid(),
            memory_id=memory_id,
            url=url,
            thumbnail_url=url,
            uploaded_by=user_id,
            width=None,
            height=None,
            created_at=to_iso(now_utc()),
        )

    def _read_within_limit(self, file: UploadFile) -> bytes:
        max_bytes = settings.max_upload_size_mb * 1024 * 1024
        content = file.file.read()
        if len(content) > max_bytes:
            raise ValidationError(
                f"File vượt quá giới hạn {settings.max_upload_size_mb}MB"
            )
        return content

    def _to_data_url(self, file: UploadFile, content: bytes) -> str:
        mime = file.content_type or "image/png"
        b64 = base64.b64encode(content).decode("ascii")
        return f"data:{mime};base64,{b64}"

    def delete_image(
        self, couple_id: str, memory_id: str, image_id: str
    ) -> bool:
        memory = self.memory_repo.get(memory_id)
        if not memory or memory.couple_id != couple_id:
            raise NotFoundError("Memory không tồn tại")
        image = self.image_repo.get(image_id)
        if not image or image.memory_id != memory_id:
            raise NotFoundError("Image không tồn tại")
        return self.image_repo.delete(image_id)