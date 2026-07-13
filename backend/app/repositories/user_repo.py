from __future__ import annotations

from app.core.constants import USERS
from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    table = USERS
    model_cls = User

    def get_by_email(self, email: str) -> User | None:
        return self.find_one({"email": email})