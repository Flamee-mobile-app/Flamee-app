from __future__ import annotations

from app.config import settings
from app.storage.base import Storage
from app.storage.mock_storage import MockStorage

_storage: Storage | None = None


def get_storage() -> Storage:
    """Return the process-wide Storage instance, creating it on first call."""
    global _storage
    if _storage is None:
        backend = settings.storage_backend
        if backend == "mock":
            _storage = MockStorage(persist_file=settings.mock_data_file)
            _storage.load_from_file()
        else:
            raise ValueError(f"Unknown storage backend: {backend}")
    return _storage


def reset_storage() -> None:
    """Clear the cached Storage. Tests use this to force a fresh instance."""
    global _storage
    _storage = None