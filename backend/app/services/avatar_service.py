from __future__ import annotations

from dataclasses import replace
from typing import Callable
from fastapi import UploadFile

from app.config import settings
from app.core.exceptions import NotFoundError
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.services.media_processing import process_avatar
from app.services.media_storage import MediaStorage
from app.utils.ids import generate_uuid
from app.utils.time import now_utc, to_iso


class AvatarService:
    def __init__(self, db, user_repo: UserRepository | None = None) -> None:
        self.user_repo = user_repo or UserRepository(db)
        self.storage = MediaStorage(db)

    def present(self, user: User) -> User:
        if not user.avatar_storage_path:
            return user
        return replace(user, avatar_url=self.storage.sign(user.avatar_storage_path))

    def upload(self, user_id: str, file: UploadFile, *, schedule_cleanup: Callable | None = None) -> User:
        current = self.user_repo.get(user_id)
        if not current:
            raise NotFoundError("User không tồn tại")
        processed = process_avatar(
            file.file, max_bytes=settings.max_upload_size_mb * 1024 * 1024
        )
        path = f"avatars/{user_id}/{generate_uuid()}/avatar.jpg"
        self.storage.upload(path, processed.content, processed.mime_type)
        try:
            updated = self.user_repo.update(
                user_id,
                avatar_storage_path=path,
                avatar_url=None,
                updated_at=to_iso(now_utc()),
            )
        except Exception:
            self.storage.remove([path])
            raise
        if current.avatar_storage_path and current.avatar_storage_path != path:
            if schedule_cleanup is not None:
                schedule_cleanup(self._remove_orphan, current.avatar_storage_path)
            else:
                self._remove_orphan(current.avatar_storage_path)
        return self.present(updated)

    def delete(self, user_id: str) -> User:
        current = self.user_repo.get(user_id)
        if not current:
            raise NotFoundError("User không tồn tại")
        updated = self.user_repo.update(
            user_id,
            avatar_storage_path=None,
            avatar_url=None,
            updated_at=to_iso(now_utc()),
        )
        if current.avatar_storage_path:
            self._remove_orphan(current.avatar_storage_path)
        return updated

    def _remove_orphan(self, path: str) -> None:
        try:
            self.storage.remove([path])
        except Exception:
            # The user record already points at the new state. A scheduled orphan
            # sweep can safely retry this private, unreferenced object later.
            pass
