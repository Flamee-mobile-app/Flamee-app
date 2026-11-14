from __future__ import annotations

import secrets
import string
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.config import settings
from app.core.constants import OTP_LENGTH
from app.core.exceptions import AuthError
from app.utils.time import to_iso, now_utc

_ALPHANUM = string.ascii_letters + string.digits
_JWT_ALGORITHM = "HS256"
_REFRESH_TOKEN_BYTES = 48


def hash_password(plain: str) -> str:
    """Hash a plaintext password using bcrypt."""
    pwd_bytes = plain.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    try:
        pwd_bytes = plain.encode("utf-8")[:72]
        return bcrypt.checkpw(pwd_bytes, hashed.encode("utf-8"))
    except Exception:
        return False


def _now_dt() -> datetime:
    return now_utc()


def create_access_token(
    user_id: str,
    *,
    extra_claims: dict | None = None,
    jti: str | None = None,
    ttl_hours: int | None = None,
) -> tuple[str, str, str]:
    """Create a signed JWT access token. Trả về (token, jti, exp_iso)."""
    if jti is None:
        jti = secrets.token_urlsafe(16)
    hours = ttl_hours if ttl_hours is not None else settings.jwt_ttl_hours
    now = _now_dt()
    exp = now + timedelta(hours=hours)
    payload: dict = {
        "sub": user_id,
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
        "type": "access",
    }
    if extra_claims:
        payload.update(extra_claims)
    token = jwt.encode(payload, settings.secret_key, algorithm=_JWT_ALGORITHM)
    return token, jti, to_iso(exp)


def create_refresh_token() -> tuple[str, str]:
    """Tạo refresh token ngẫu nhiên. Trả về (token, exp_iso)."""
    token = secrets.token_urlsafe(_REFRESH_TOKEN_BYTES)
    exp = _now_dt() + timedelta(days=settings.jwt_refresh_ttl_days)
    return token, to_iso(exp)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT. Raises AuthError on failure."""
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[_JWT_ALGORITHM])
    except jwt.PyJWTError as exc:
        raise AuthError("Invalid or expired token") from exc


def decode_token_unchecked(token: str) -> dict | None:
    """Decode without raising; trả None nếu lỗi (dùng cho introspection)."""
    try:
        return jwt.decode(
            token,
            settings.secret_key,
            algorithms=[_JWT_ALGORITHM],
            options={"verify_exp": False},
        )
    except Exception:
        return None


def generate_otp(length: int = OTP_LENGTH) -> str:
    """Generate a numeric OTP of the given length."""
    return "".join(secrets.choice(string.digits) for _ in range(length))
