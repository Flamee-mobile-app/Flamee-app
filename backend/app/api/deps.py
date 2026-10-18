"""FastAPI dependency providers."""
from __future__ import annotations

from fastapi import Depends, Header
from supabase import Client

from app.ai.factory import get_ai_provider  # re-export
from app.core.constants import USERS
from app.core.exceptions import AuthError
from app.core.security import decode_token
from app.database import get_supabase
from app.repositories.auth_session_repo import AuthSessionRepository
from app.repositories.couple_repo import CoupleRepository, InviteCodeRepository
from app.repositories.mood_repo import MoodAlertRepository, MoodRepository
from app.repositories.user_repo import UserRepository
from app.services.couple_service import CoupleService
from app.services.mood_service import MoodService


def get_db() -> Client:
    """FastAPI dependency exposing the Supabase client."""
    return get_supabase()


def _extract_bearer(authorization: str | None) -> str:
    if not authorization:
        raise AuthError("Missing Authorization header")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise AuthError("Invalid Authorization header")
    return parts[1]


def _load_user(db: Client, user_id: str) -> dict:
    resp = db.table(USERS).select("*").eq("id", user_id).maybe_single().execute()
    if not resp.data:
        raise AuthError("User no longer exists")
    return resp.data


def _check_session_active(db: Client, jti: str | None, user_id: str) -> None:
    """Check jti có active trong auth_sessions không (revocation check)."""
    if not jti:
        raise AuthError("Missing session; please log in again")
    try:
        session = AuthSessionRepository(db).get_by_jti(jti)
        if session is None or session.user_id != user_id or session.is_revoked():
            raise AuthError("Session đã bị thu hồi, vui lòng đăng nhập lại")
        if session.is_access_expired():
            raise AuthError("Token đã hết hạn")
    except AuthError:
        raise
    except Exception:
        raise AuthError("Unable to verify session") from None


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Client = Depends(get_db),
) -> dict:
    """Resolve the current user from a Bearer token. Raises AuthError on failure."""
    token = _extract_bearer(authorization)
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise AuthError("Token missing subject")
    jti = payload.get("jti")
    _check_session_active(db, jti, user_id)
    user = _load_user(db, user_id)
    # Stash jti để /auth/logout biết revoke session nào
    if jti:
        user["__jti__"] = jti
    return user


def get_optional_user(
    authorization: str | None = Header(default=None),
    db: Client = Depends(get_db),
) -> dict | None:
    if not authorization:
        return None
    token = _extract_bearer(authorization)
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        return None
    jti = payload.get("jti")
    _check_session_active(db, jti, user_id)
    resp = db.table(USERS).select("*").eq("id", user_id).maybe_single().execute()
    if not resp.data:
        return None
    if jti:
        resp.data["__jti__"] = jti
    return resp.data


# -----------------------------------------------------------------------------
# Service dependencies
# -----------------------------------------------------------------------------
def get_mood_service(db: Client = Depends(get_db)) -> MoodService:
    return MoodService(db)


def get_couple_service(db: Client = Depends(get_db)) -> CoupleService:
    return CoupleService(
        db=db,
        couple_repo=CoupleRepository(db),
        invite_repo=InviteCodeRepository(db),
        user_repo=UserRepository(db),
    )


__all__ = [
    "get_db",
    "get_optional_user",
    "get_current_user",
    "get_mood_service",
    "get_couple_service",
    "get_ai_provider",
]
