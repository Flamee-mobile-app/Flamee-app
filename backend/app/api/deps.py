from __future__ import annotations

from fastapi import Depends, Header
from supabase import Client

from app.ai.base import AIProvider
from app.ai.factory import get_ai_provider
from app.core.constants import USERS
from app.core.exceptions import AuthError, NotFoundError
from app.core.security import decode_token
from app.database import get_supabase


def get_db() -> Client:
    """FastAPI dependency exposing the Supabase client."""
    return get_supabase()


def get_ai() -> AIProvider:
    """FastAPI dependency exposing the configured AIProvider."""
    return get_ai_provider()


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
    return _load_user(db, user_id)


def get_optional_user(
    authorization: str | None = Header(default=None),
    db: Client = Depends(get_db),
) -> dict | None:
    """Same as `get_current_user` but returns None when no token is present."""
    if not authorization:
        return None
    token = _extract_bearer(authorization)
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        return None
    resp = db.table(USERS).select("*").eq("id", user_id).maybe_single().execute()
    return resp.data

