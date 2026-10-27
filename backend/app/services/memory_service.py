from __future__ import annotations

from collections import defaultdict
from dataclasses import replace
from datetime import timedelta
from uuid import NAMESPACE_URL, uuid5

from fastapi import UploadFile
from supabase import Client
from postgrest.exceptions import APIError

from app.config import settings
from app.core.constants import MemoryCategory
from app.core.exceptions import ConflictError, FeatureUnavailableError, NotFoundError, ValidationError
from app.models.memory import Memory, MemoryImage
from app.repositories.memory_repo import (
    MemoryImageRepository,
    MemoryRepository,
)
from app.repositories.user_repo import UserRepository
from app.schemas.memory import (
    CreateMemoryRequest,
    MemoryListItem,
    MemoryAuthor,
    UpdateMemoryRequest,
)
from app.utils.ids import generate_uuid
from app.utils.time import now_utc, to_iso
from app.services.media_processing import process_memory_image
from app.services.media_storage import MediaStorage, SIGNED_URL_TTL_SECONDS


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
        request_key: str | None = None,
    ) -> Memory:
        memory_id = str(uuid5(NAMESPACE_URL, f"flamee-memory:{user_id}:{request_key}")) if request_key else generate_uuid()
        existing = self.memory_repo.get(memory_id) if request_key else None
        if existing:
            return self._same_draft(existing, user_id, couple_id, payload)
        now_iso = to_iso(now_utc())
        fields = dict(
            id=memory_id,
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
        try:
            return self.memory_repo.create(**fields)
        except APIError as error:
            if request_key and error.code == "23505":
                existing = self.memory_repo.get(memory_id)
                if existing:
                    return self._same_draft(existing, user_id, couple_id, payload)
            raise

    @staticmethod
    def _same_draft(memory: Memory, user_id: str, couple_id: str, payload: CreateMemoryRequest) -> Memory:
        if memory.created_by != user_id or memory.couple_id != couple_id or any(
            getattr(memory, key) != value for key, value in payload.model_dump().items()
        ):
            raise ConflictError("Mã yêu cầu đã được dùng cho nội dung khác", code="idempotency_conflict")
        return memory

    def list_memories(
        self,
        couple_id: str,
        *,
        category: str | None = None,
        year: int | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[MemoryListItem], int, bool]:
        if category:
            valid = {m.value for m in MemoryCategory}
            if category not in valid:
                raise ValidationError(
                    f"category must be one of: {sorted(valid)}"
                )
        memories = self.memory_repo.find_by_couple(
            couple_id, category=category, year=year, limit=limit, offset=offset
        )
        images_by_memory: dict[str, list[MemoryImage]] = defaultdict(list)
        page_images = self.image_repo.find_by_memories([memory.id for memory in memories])
        for image in page_images:
            images_by_memory[image.memory_id].append(image)
        # List needs one cover per record. Keep the full metadata count, but
        # defer signing the remaining album until an authorized detail read.
        cover_images = [images[0] for images in images_by_memory.values() if images]
        authors = UserRepository(self.db).find_memory_authors(
            couple_id, list({memory.created_by for memory in memories})
        )
        # Sign every visible private asset in one Storage round trip.
        expires_at = to_iso(now_utc() + timedelta(seconds=SIGNED_URL_TTL_SECONDS))
        signed = self.storage.sign_many([
            path for image in cover_images for path in (image.storage_path, image.thumbnail_path)
        ] + [author["avatar_storage_path"] for author in authors if author.get("avatar_storage_path")])
        covers = {image.memory_id: image for image in self._present_images(cover_images, signed=signed, expires_at=expires_at)}
        author_map = {
            author["id"]: MemoryAuthor(
                id=author["id"], full_name=author.get("full_name", ""),
                username=author.get("username"),
                avatar_url=signed.get(author["avatar_storage_path"])
                if author.get("avatar_storage_path") else author.get("avatar_url"),
            )
            for author in authors
        }
        items: list[MemoryListItem] = []
        for memory in memories:
            images = images_by_memory[memory.id]
            cover = covers.get(memory.id)
            item = MemoryListItem.from_memory(memory, [cover] if cover else [], image_count=len(images))
            item.author = author_map.get(memory.created_by)
            items.append(item)
        total = self.memory_repo.count_by_couple(couple_id, category=category, year=year)
        return items, total, offset + len(items) < total

    def get_memory(
        self, couple_id: str, memory_id: str
    ) -> tuple[Memory, list[MemoryImage]]:
        memory = self.memory_repo.get(memory_id)
        if not memory or memory.couple_id != couple_id:
            raise NotFoundError("Memory không tồn tại")
        images = self.get_memory_images(couple_id, memory)
        return memory, images

    def get_memory_images(self, couple_id: str, memory: Memory) -> list[MemoryImage]:
        """Present images for a canonical record already read or written by this request."""
        if memory.couple_id != couple_id:
            raise NotFoundError("Memory không tồn tại")
        return self._present_images(self.image_repo.find_by_memory(memory.id))

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
        request_key: str | None = None,
    ) -> MemoryImage:
        memory = self.memory_repo.get(memory_id)
        if not memory or memory.couple_id != couple_id:
            raise NotFoundError("Memory không tồn tại")
        file_id = str(uuid5(NAMESPACE_URL, f"flamee-image:{user_id}:{memory_id}:{request_key}")) if request_key else generate_uuid()
        existing = self.image_repo.get(file_id) if request_key else None
        if existing:
            if existing.memory_id != memory_id or existing.uploaded_by != user_id:
                raise ConflictError("Mã yêu cầu ảnh không hợp lệ")
            return self._present_images([existing])[0]
        max_bytes = settings.max_upload_size_mb * 1024 * 1024
        processed = process_memory_image(file.file, max_bytes=max_bytes)
        # Concurrent attempts use separate object paths; the metadata ID dedupes
        # successful writes, and a losing attempt cleans only its own objects.
        storage_id = generate_uuid() if request_key else file_id
        prefix = f"memories/{couple_id}/{memory_id}/{storage_id}"
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
        except Exception as error:
            self.storage.remove(uploaded)
            if request_key and isinstance(error, APIError) and error.code == "23505":
                existing = self.image_repo.get(file_id)
                if existing and existing.memory_id == memory_id and existing.uploaded_by == user_id:
                    return self._present_images([existing])[0]
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

    def _present_images(self, images: list[MemoryImage], *, signed: dict[str, str] | None = None, expires_at: str | None = None) -> list[MemoryImage]:
        expires_at = expires_at or to_iso(now_utc() + timedelta(seconds=SIGNED_URL_TTL_SECONDS))
        if signed is None:
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
            presented.append(replace(
                image, url=url, thumbnail_url=thumbnail_url,
                url_expires_at=expires_at if image.storage_path else None,
            ))
        return presented
