from __future__ import annotations

from app.core.exceptions import AuthError, ConflictError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.repositories.auth_session_repo import AuthSessionRepository
from hashlib import sha256
from app.utils.ids import generate_uuid
from app.utils.time import now_utc, to_iso


class AuthService:
    """Authentication / user account operations."""

    def __init__(self, user_repo: UserRepository) -> None:
        self.user_repo = user_repo
        self.sessions = AuthSessionRepository(user_repo.db)

    def _issue_session(self, user_id: str) -> dict[str, str]:
        token, jti, expires_at = create_access_token(user_id)
        refresh, refresh_expires_at = create_refresh_token()
        now = to_iso(now_utc())
        self.sessions.create(
            id=generate_uuid(), user_id=user_id, jti=jti,
            expires_at=expires_at, created_at=now, updated_at=now,
            refresh_token=sha256(refresh.encode()).hexdigest(),
            refresh_expires_at=refresh_expires_at,
        )
        return {"access_token": token, "refresh_token": refresh, "expires_at": expires_at}

    def refresh(self, refresh_token: str) -> tuple[User, dict[str, str]]:
        digest = sha256(refresh_token.encode()).hexdigest()
        session = self.sessions.get_by_refresh_token(digest)
        if not session or session.is_revoked() or session.is_refresh_expired():
            raise AuthError("Invalid or expired refresh token")
        user = self.me(session.user_id)
        token, jti, expires_at = create_access_token(user.id)
        refresh, refresh_expires_at = create_refresh_token()
        if not self.sessions.rotate(
            session.id, digest, jti, expires_at,
            sha256(refresh.encode()).hexdigest(), refresh_expires_at,
        ):
            raise AuthError("Invalid or expired refresh token")
        return user, {"access_token": token, "refresh_token": refresh, "expires_at": expires_at}

    def logout(self, user_id: str, jti: str) -> None:
        session = self.sessions.get_by_jti(jti)
        if not session or session.user_id != user_id:
            raise AuthError("Invalid session")
        now = to_iso(now_utc())
        self.sessions.update(session.id, revoked_at=now, updated_at=now)

    def register(self, email: str, password: str, full_name: str, username: str | None = None) -> tuple[User, dict[str, str]]:
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
        return user, self._issue_session(user.id)

    def login(self, email: str, password: str) -> tuple[User, dict[str, str]]:
        user = self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise AuthError("Email hoặc mật khẩu không đúng")
        return user, self._issue_session(user.id)

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
        self.sessions.revoke_all_for_user(user_id)
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
        nickname: str | None = None,
        timezone: str | None = None,
    ) -> User:
        patch: dict = {"updated_at": to_iso(now_utc())}
        if nickname is not None:
            patch["nickname"] = nickname.strip() or None
        if timezone is not None:
            patch["timezone"] = timezone
        if full_name is not None:
            patch["full_name"] = full_name
        if birth_date is not None:
            patch["birth_date"] = birth_date or None
        if gender is not None:
            patch["gender"] = gender or None
        if username is not None:
            patch["username"] = username.strip() or None
        return self.user_repo.update(user_id, **patch)

