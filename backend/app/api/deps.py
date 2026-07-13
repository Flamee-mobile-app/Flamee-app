from __future__ import annotations

from typing import Any

from fastapi import Depends, Header

from app.ai.base import AIProvider
from app.ai.factory import get_ai_provider
from app.core.constants import COUPLE_MEMBERS, USERS
from app.core.exceptions import AuthError, NotFoundError
from app.core.security import decode_token
from app.storage.base import Storage
from app.storage.factory import get_storage


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


def _load_user(storage: Storage, user_id: str) -> dict:
    user = storage.get(USERS, user_id)
    if not user:
        raise AuthError("User no longer exists")
    return user


def get_current_user(
    authorization: str | None = Header(default=None),
    storage: Storage = Depends(get_storage),
) -> dict:
    """Resolve the current user from a Bearer token. Raises AuthError on failure."""
    token = _extract_bearer(authorization)
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise AuthError("Token missing subject")
    return _load_user(storage, user_id)


def get_optional_user(
    authorization: str | None = Header(default=None),
    storage: Storage = Depends(get_storage),
) -> dict | None:
    """Same as `get_current_user` but returns None when no token is present."""
    if not authorization:
        return None
    token = _extract_bearer(authorization)
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        return None
    return storage.get(USERS, user_id)


def get_current_couple_member(
    user: dict = Depends(get_current_user),
    storage: Storage = Depends(get_storage),
) -> tuple[dict, dict]:
    """Resolve the active couple-member record for the current user.

    Returns (user_record, couple_member_record). Raises NotFoundError
    when the user is not part of any couple.
    """
    user_id = user["id"]
    members = storage.find(COUPLE_MEMBERS, {"user_id": user_id})
    if not members:
        raise NotFoundError("User is not part of any couple")
    return user, members[0]