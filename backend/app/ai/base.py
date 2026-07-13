from __future__ import annotations

from abc import ABC, abstractmethod


class AIProvider(ABC):
    """Abstract AI provider interface."""

    @abstractmethod
    async def chat(self, system: str, user: str, *, json_mode: bool = False) -> str:
        """Return the model's response text. When `json_mode=True`, must return valid JSON."""