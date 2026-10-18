"""Auth Session: lưu refresh token, hỗ trợ revoke."""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Optional

from app.utils.time import now_utc, to_iso


def _utcnow_iso() -> str:
    return to_iso(now_utc())


@dataclass
class AuthSession:
    id: str
    user_id: str
    jti: str
    expires_at: str
    created_at: str
    updated_at: str
    refresh_token: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    refresh_expires_at: Optional[str] = None
    revoked_at: Optional[str] = None
    extra: dict = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        # Postgres không có cột extra — bỏ khi persist
        data.pop("extra", None)
        return data

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "AuthSession":
        known = {k: v for k, v in d.items() if k in cls.__dataclass_fields__}
        return cls(**known)

    def is_revoked(self) -> bool:
        return self.revoked_at is not None

    def is_access_expired(self) -> bool:
        try:
            exp = datetime.fromisoformat(self.expires_at)
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            return exp <= now_utc()
        except (ValueError, TypeError):
            return True

    def is_refresh_expired(self) -> bool:
        if not self.refresh_expires_at:
            return True
        try:
            exp = datetime.fromisoformat(self.refresh_expires_at)
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            return exp <= now_utc()
        except (ValueError, TypeError):
            return True
