from __future__ import annotations

from collections import defaultdict
from dataclasses import replace

from fastapi import UploadFile
from supabase import Client

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
from app.utils.ids import generate_uuid
from app.utils.time import now_utc, to_iso
from app.services.media_processing import process_memory_image
from app.services.media_storage import MediaStorage


class MemoryService:
    """Memory CRUD + image upload via Supabase Storage."""

    def __init__(
        self,
        db: Client,
        memory_repo: MemoryRepository,
        image_repo: MemoryImageRepository,
    ) -> None:
        self.db = db
        self.memory_repo = memory_repo
        self.image_repo = image_repo
        self.storage = MediaStorage(db)

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
        images_by_memory: dict[str, list[MemoryImage]] = defaultdict(list)
        page_images = self._present_images(
            self.image_repo.find_by_memories([memory.id for memory in memories])
        )
        for image in page_images:
            images_by_memory[image.memory_id].append(image)
        items: list[MemoryListItem] = []
        for memory in memories:
            images = images_by_memory[memory.id]
            items.append(MemoryListItem.from_memory(memory, images))
        return items, len(items)

    def get_memory(
        self, couple_id: str, memory_id: str
    ) -> tuple[Memory, list[MemoryImage]]:
        memory = self.memory_repo.get(memory_id)
        if not memory or memory.couple_id != couple_id:
            raise NotFoundError("Memory không tồn tại")
        images = self._present_images(self.image_repo.find_by_memory(memory.id))
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
        images = self.image_repo.find_by_memory(memory_id)
        self.storage.remove(
            path
            for image in images
            for path in (image.storage_path, image.thumbnail_path)
        )
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
        max_bytes = settings.max_upload_size_mb * 1024 * 1024
        processed = process_memory_image(file.file, max_bytes=max_bytes)
        file_id = generate_uuid()
        prefix = f"memories/{couple_id}/{memory_id}/{file_id}"
        storage_path = f"{prefix}/original.jpg"
        thumbnail_path = f"{prefix}/thumbnail.jpg"
        uploaded: list[str] = []
        try:
            self.storage.upload(
                storage_path,
                processed.original.content,
                processed.original.mime_type,
            )
            uploaded.append(storage_path)
            self.storage.upload(
                thumbnail_path,
                processed.thumbnail.content,
                processed.thumbnail.mime_type,
            )
            uploaded.append(thumbnail_path)
            image = self.image_repo.create(
                id=file_id,
                memory_id=memory_id,
                url=None,
                thumbnail_url=None,
                storage_path=storage_path,
                thumbnail_path=thumbnail_path,
                mime_type=processed.original.mime_type,
                size_bytes=len(processed.original.content),
                uploaded_by=user_id,
                width=processed.original.width,
                height=processed.original.height,
                created_at=to_iso(now_utc()),
            )
        except Exception:
            self.storage.remove(uploaded)
            raise
        return self._present_images([image])[0]

    def delete_image(
        self, couple_id: str, memory_id: str, image_id: str
    ) -> bool:
        memory = self.memory_repo.get(memory_id)
        if not memory or memory.couple_id != couple_id:
            raise NotFoundError("Memory không tồn tại")
        image = self.image_repo.get(image_id)
        if not image or image.memory_id != memory_id:
            raise NotFoundError("Image không tồn tại")
        self.storage.remove([image.storage_path, image.thumbnail_path])
        return self.image_repo.delete(image_id)

    def _present_images(self, images: list[MemoryImage]) -> list[MemoryImage]:
        signed = self.storage.sign_many(
            path
            for image in images
            for path in (image.storage_path, image.thumbnail_path)
        )
        presented: list[MemoryImage] = []
        for image in images:
            url = signed.get(image.storage_path) if image.storage_path else image.url
            thumbnail_url = (
                signed.get(image.thumbnail_path)
                if image.thumbnail_path
                else image.thumbnail_url or url
            )
            presented.append(replace(image, url=url, thumbnail_url=thumbnail_url))
        return presented
