from __future__ import annotations

import secrets
import string
import uuid

from app.core.constants import INVITE_CODE_LENGTH, INVITE_CODE_PREFIX

_ALPHANUM = string.ascii_uppercase + string.digits


def generate_uuid() -> str:
    """Return a new UUID4 as a string."""
    return str(uuid.uuid4())


def generate_invite_code() -> str:
    """Generate a couple invite code: PREFIX-XXXXXX (uppercase alphanumeric)."""
    suffix = "".join(secrets.choice(_ALPHANUM) for _ in range(INVITE_CODE_LENGTH))
    return f"{INVITE_CODE_PREFIX}-{suffix}"