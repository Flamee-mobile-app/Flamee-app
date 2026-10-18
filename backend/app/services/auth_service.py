from __future__ import annotations

from app.core.exceptions import AuthError, ConflictError
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.utils.ids import generate_uuid
from app.utils.time import now_utc, to_iso


class AuthService:
    """Authentication / user account operations."""

    def __init__(self, user_repo: UserRepository) -> None:
        self.user_repo = user_repo

    def register(self, email: str, password: str, full_name: str, username: str | None = None) -> tuple[User, str]:
        if self.user_repo.get_by_email(email):
            raise ConflictError("Email đã tồn tại")
        now_iso = to_iso(now_utc())
        user = self.user_repo.create(
            id=generate_uuid(),
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            username=(username.strip() or None) if username is not None else None,
            created_at=now_iso,
            updated_at=now_iso,
        )
        token = create_access_token(user.id)
        return user, token

    def login(self, email: str, password: str) -> tuple[User, str]:
        user = self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise AuthError("Email hoặc mật khẩu không đúng")
        return user, create_access_token(user.id)

    def me(self, user_id: str) -> User:
        user = self.user_repo.get(user_id)
        if not user:
            raise AuthError("User không tồn tại")
        return user

    def change_password(
        self, user_id: str, current: str, new: str
    ) -> None:
        user = self.me(user_id)
        if not verify_password(current, user.password_hash):
            raise AuthError("Mật khẩu hiện tại không đúng")
        self.user_repo.update(
            user_id,
            password_hash=hash_password(new),
            updated_at=to_iso(now_utc()),
        )

    def update_profile(
        self,
        user_id: str,
        full_name: str | None,
        birth_date: str | None,
        gender: str | None,
        username: str | None = None,
    ) -> User:
        patch: dict = {"updated_at": to_iso(now_utc())}
        if full_name is not None:
            patch["full_name"] = full_name
        if birth_date is not None:
            patch["birth_date"] = birth_date or None
        if gender is not None:
            patch["gender"] = gender or None
        if username is not None:
            patch["username"] = username.strip() or None
        return self.user_repo.update(user_id, **patch)

