from __future__ import annotations

from app.ai.base import AIProvider
from app.ai.mock_provider import MockAIProvider
from app.config import settings

_ai: AIProvider | None = None


def get_ai_provider() -> AIProvider:
    """Return the process-wide AIProvider, creating it on first call."""
    global _ai
    if _ai is None:
        backend = settings.ai_backend
        if backend == "mock":
            _ai = MockAIProvider()
        else:
            raise ValueError(f"Unknown AI backend: {backend}")
    return _ai


def reset_ai_provider() -> None:
    """Clear the cached AIProvider. Tests use this to force a fresh instance."""
    global _ai
    _ai = None