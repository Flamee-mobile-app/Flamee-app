from __future__ import annotations

from supabase import Client, create_client
from supabase.lib.client_options import SyncClientOptions
import httpx
from threading import Lock

from app.config import settings

_supabase: Client | None = None
_transport: httpx.Client | None = None
_client_lock = Lock()


def get_supabase() -> Client:
    """Return the process-wide Supabase client, creating it on first call."""
    global _supabase, _transport
    with _client_lock:
        if _supabase is not None:
            return _supabase
        # This sync client is shared by API threads and socket revalidation.
        # Use separate pooled HTTP/1.1 connections instead of multiplexing
        # reads/writes on one HTTP/2 TLS socket (WinError10035 under live load).
        transport = httpx.Client(http2=False, timeout=httpx.Timeout(30, connect=10),
                                 follow_redirects=True,
                                 limits=httpx.Limits(max_connections=30, max_keepalive_connections=10))
        try:
            _supabase = create_client(settings.supabase_url, settings.supabase_service_key,
                                     options=SyncClientOptions(httpx_client=transport))
            _transport = transport
        except Exception:
            transport.close()
            raise
    return _supabase


def reset_supabase() -> None:
    """Clear the cached client. Tests use this to force a fresh instance."""
    global _supabase, _transport
    with _client_lock:
        _supabase = None
        if _transport is not None:
            _transport.close()
            _transport = None
