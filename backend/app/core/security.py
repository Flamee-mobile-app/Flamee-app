from __future__ import annotations

import secrets
import string
from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

from app.config import settings
from app.core.constants import OTP_LENGTH
from app.core.exceptions import AuthError

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
_ALPHANUM = string.ascii_letters + string.digits
_JWT_ALGORITHM = "HS256"


def hash_password(plain: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return _pwd_context.verify(plain, hashed)


def create_access_token(user_id: str, *, extra_claims: dict | None = None) -> str:
    """Create a signed JWT access token for a user."""
    now = datetime.now(timezone.utc)
    exp = now + timedelta(hours=settings.jwt_ttl_hours)
    payload: dict = {
        "sub": user_id,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.secret_key, algorithm=_JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT. Raises AuthError on failure."""
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[_JWT_ALGORITHM])
    except jwt.PyJWTError as exc:
        raise AuthError("Invalid or expired token") from exc


def generate_otp(length: int = OTP_LENGTH) -> str:
    """Generate a numeric OTP of the given length."""
    return "".join(secrets.choice(string.digits) for _ in range(length))