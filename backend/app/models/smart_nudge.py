"""Models cho Smart Nudge và Tiny Moment."""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Optional


@dataclass
class SmartNudge:
    id: str
    couple_id: str
    receiver_id: str
    status: str
    observation: str
    action_type: str
    draft: str
    reason: str
    tone: str
    created_at: str
    partner_id: Optional[str] = None
    source: str = "ai_agent"
    latency_ms: Optional[int] = None
    snoozed_until: Optional[str] = None
    expires_at: Optional[str] = None
    is_crisis: bool = False
    helplines: Optional[list[dict]] = field(default=None)
    # Plan mục 4: version + snooze_count
    version: int = 1
    snooze_count: int = 0

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "SmartNudge":
        return cls(
            **{k: v for k, v in d.items() if k in cls.__dataclass_fields__}
        )


@dataclass
class TinyMoment:
    id: str
    couple_id: str
    sender_id: str
    moment_type: str
    created_at: str
    receiver_id: Optional[str] = None
    content: Optional[str] = None
    reaction: Optional[str] = None
    nudge_id: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "TinyMoment":
        return cls(
            **{k: v for k, v in d.items() if k in cls.__dataclass_fields__}
        )
