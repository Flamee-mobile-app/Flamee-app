from __future__ import annotations

from app.config import settings
from app.core.exceptions import AuthError, ConflictError
from app.core.security import (
    create_access_token,
    generate_otp,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.utils.ids import generate_uuid
from app.utils.time import add_seconds, now_utc, to_iso


class AuthService:
    """Authentication / user account operations."""

    # Module-level in-memory OTP store, keyed by email.
    # MVP mock: never persisted, never sent over the wire.
    _otp_store: dict[str, dict[str, str | int]] = {}

    def __init__(self, user_repo: UserRepository) -> None:
        self.user_repo = user_repo

    def register(self, email: str, password: str, full_name: str) -> tuple[User, str]:
        if self.user_repo.get_by_email(email):
            raise ConflictError("Email đã tồn tại")
        now_iso = to_iso(now_utc())
        user = self.user_repo.create(
            id=generate_uuid(),
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
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
        avatar_url: str | None,
        birth_date: str | None,
        gender: str | None,
    ) -> User:
        patch: dict = {"updated_at": to_iso(now_utc())}
        if full_name is not None:
            patch["full_name"] = full_name
        if avatar_url is not None:
            patch["avatar_url"] = avatar_url or None
        if birth_date is not None:
            patch["birth_date"] = birth_date or None
        if gender is not None:
            patch["gender"] = gender or None
        return self.user_repo.update(user_id, **patch)

    def forgot_password(self, email: str) -> tuple[str, int]:
        """Mock flow: generate OTP, store it, return it directly (no real email)."""
        otp = generate_otp()
        expires_at = add_seconds(now_utc(), settings.otp_ttl_seconds)
        self._otp_store[email] = {
            "otp": otp,
            "expires_at": int(expires_at.timestamp()),
        }
        return otp, settings.otp_ttl_seconds

    def reset_password(self, email: str, otp: str, new_password: str) -> None:
        entry = self._otp_store.get(email)
        if not entry or entry["otp"] != otp:
            raise AuthError("OTP không hợp lệ")
        if int(entry["expires_at"]) < int(now_utc().timestamp()):
            raise AuthError("OTP đã hết hạn")
        user = self.user_repo.get_by_email(email)
        if not user:
            raise AuthError("User không tồn tại")
        self.user_repo.update(
            user.id,
            password_hash=hash_password(new_password),
            updated_at=to_iso(now_utc()),
        )
        self._otp_store.pop(email, None)