from __future__ import annotations

from supabase import Client, create_client

from app.config import settings

_supabase: Client | None = None


def get_supabase() -> Client:
    """Return the process-wide Supabase client, creating it on first call."""
    global _supabase
    if _supabase is None:
        _supabase = create_client(settings.supabase_url, settings.supabase_service_key)
    return _supabase


def reset_supabase() -> None:
    """Clear the cached client. Tests use this to force a fresh instance."""
    global _supabase
    _supabase = None
