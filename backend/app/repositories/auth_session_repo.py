"""Repository cho AuthSession."""
from __future__ import annotations

from typing import Optional

from app.models.auth_session import AuthSession
from app.repositories.base import BaseRepository


class AuthSessionRepository(BaseRepository[AuthSession]):
    table = "auth_sessions"
    model_cls = AuthSession

    def get_by_jti(self, jti: str) -> Optional[AuthSession]:
        return self.find_one({"jti": jti})

    def get_by_refresh_token(self, refresh_token: str) -> Optional[AuthSession]:
        return self.find_one({"refresh_token": refresh_token})

    def rotate(self, session_id: str, old_hash: str, jti: str, expires_at: str,
               new_hash: str, refresh_expires_at: str) -> bool:
        response = self.db.rpc("rotate_auth_session", {
            "p_session_id": session_id, "p_old_hash": old_hash,
            "p_jti": jti, "p_expires_at": expires_at,
            "p_new_hash": new_hash, "p_refresh_expires_at": refresh_expires_at,
        }).execute()
        return response.data is True

    def find_active_by_user(self, user_id: str) -> list[AuthSession]:
        """Sessions chưa revoke, còn hạn (theo access token)."""
        sessions = self.find({"user_id": user_id})
        return [s for s in sessions if not s.is_revoked() and not s.is_access_expired()]

    def revoke_all_for_user(self, user_id: str) -> int:
        """Đánh dấu revoked cho tất cả session active của user."""
        from app.utils.time import to_iso, now_utc

        sessions = self.find({"user_id": user_id})
        count = 0
        now_iso = to_iso(now_utc())
        for s in sessions:
            if s.revoked_at is None:
                self.update(s.id, revoked_at=now_iso, updated_at=now_iso)
                count += 1
        return count
