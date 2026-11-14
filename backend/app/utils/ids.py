from __future__ import annotations

import secrets
import string
import uuid

from app.core.constants import INVITE_CODE_LENGTH

_ALPHANUM = string.ascii_uppercase + string.digits


def generate_uuid() -> str:
    """Return a new UUID4 as a string."""
    return str(uuid.uuid4())


def generate_invite_code() -> str:
    """Generate a six-character uppercase alphanumeric invite code."""
    return "".join(secrets.choice(_ALPHANUM) for _ in range(INVITE_CODE_LENGTH))
