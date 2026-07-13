from __future__ import annotations

import json

from app.ai.base import AIProvider


class MockAIProvider(AIProvider):
    """Rule-based AI provider used in dev and tests.

    Returns deterministic mock content. Tests can call `set_response`
    to inject a canned string (or JSON string when `json_mode=True`).
    """

    def __init__(self) -> None:
        self._next_response: str | None = None

    def set_response(self, text: str) -> None:
        """Inject the next response returned by `chat`. Consumed once."""
        self._next_response = text

    async def chat(self, system: str, user: str, *, json_mode: bool = False) -> str:
        if self._next_response is not None:
            value = self._next_response
            self._next_response = None
            return value
        if json_mode:
            payload = {
                "mock": True,
                "system": system[:30],
                "user": user[:30],
            }
            return json.dumps(payload, ensure_ascii=False)
        return f"[mock-ai] sys={system[:30]!r} user={user[:30]!r}"