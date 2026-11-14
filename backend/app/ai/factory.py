"""AI factory — chọn provider theo FLAMEE_AI_PROVIDER."""
from __future__ import annotations

from app.ai.base import AIProvider
from app.config import settings

_ai: AIProvider | None = None


def get_ai_provider() -> AIProvider:
    """Trả về AIProvider process-wide, tạo mới ở lần gọi đầu."""
    global _ai
    if _ai is None:
        backend = (settings.ai_provider or "openai").lower()
        if backend == "gemini":
            from app.ai.gemini_provider import GeminiProvider

            _ai = GeminiProvider()
        elif backend == "openai":
            from app.ai.openai_provider import OpenAIProvider

            _ai = OpenAIProvider()
        else:
            raise ValueError(f"Unknown AI provider: {backend}")
    return _ai


def reset_ai_provider() -> None:
    """Reset cache — chỉ dùng trong test."""
    global _ai
    _ai = None