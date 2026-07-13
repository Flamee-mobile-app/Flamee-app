from __future__ import annotations

from datetime import date, datetime, timedelta, timezone


def now_utc() -> datetime:
    """Return current UTC time as a timezone-aware datetime."""
    return datetime.now(timezone.utc)


def today_utc_date() -> date:
    """Return today's UTC date."""
    return now_utc().date()


def add_seconds(dt: datetime, seconds: int) -> datetime:
    """Return dt + seconds."""
    return dt + timedelta(seconds=seconds)


def add_hours(dt: datetime, hours: int) -> datetime:
    """Return dt + hours."""
    return dt + timedelta(hours=hours)


def to_iso(dt: datetime) -> str:
    """Serialize a datetime to ISO-8601 string."""
    return dt.isoformat()


def from_iso(s: str) -> datetime:
    """Parse an ISO-8601 string back into a datetime."""
    return datetime.fromisoformat(s)