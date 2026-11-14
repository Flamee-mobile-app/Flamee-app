"""AI Provider abstraction layer."""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class AIProvider(ABC):
    """Abstract AI provider.

    Implementations expose both async (chat) and sync (chat_sync) interfaces so
    they can be used from background tasks or inside async endpoints.
    """

    @abstractmethod
    async def chat(self, system: str, user: str, *, json_mode: bool = False) -> str:
        """Return the model's response text."""

    @abstractmethod
    def chat_sync(self, system: str, user: str, *, json_mode: bool = False) -> str:
        """Synchronous variant used inside BackgroundTasks.

        Providers are responsible for not blocking the event loop too long
        (the Smart Nudge pipeline budgets a 6s SLA).
        """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return human-friendly provider id (used for logging)."""