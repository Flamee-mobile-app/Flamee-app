from __future__ import annotations

from app.core.constants import USERS
from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    table = USERS
    model_cls = User

    def get_by_email(self, email: str) -> User | None:
        return self.find_one({"email": email})

    def find_memory_authors(self, couple_id: str, user_ids: list[str]) -> list[dict]:
        if not user_ids:
            return []
        response = (
            self.db.table(self.table)
            .select("id,full_name,username,avatar_url,avatar_storage_path")
            .eq("couple_id", couple_id)
            .in_("id", user_ids)
            .execute()
        )
        return response.data or []
