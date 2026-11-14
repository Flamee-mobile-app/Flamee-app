"""Schemas cho Smart Nudge và Tiny Moment."""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

# Theo spec mục 6.5
ACTION_TYPES = ("text", "voice", "photo", "call", "other")
TONES = ("gentle", "playful", "supportive", "celebratory")
NUDGE_STATUSES = ("new", "completed", "snoozed", "dismissed", "expired")
MOMENT_TYPES = ("text", "voice", "photo", "signal")
RATINGS = ("thumbs_up", "thumbs_down")
FEEDBACK_REASONS = (
    "wrong_tone",
    "too_generic",
    "wrong_time",
    "not_our_style",
    "other",
)


class SmartNudgeGenerationOutput(BaseModel):
    """Pydantic schema cho output mong đợi từ LLM (json_mode)."""

    observation: str = Field(max_length=120)
    action_type: Literal["text", "voice", "photo", "call", "other"]
    draft: str = Field(max_length=280)
    reason: str = Field(max_length=100)
    tone: Literal["gentle", "playful", "supportive", "celebratory"]


class SmartNudgeResponse(BaseModel):
    id: str
    couple_id: str
    receiver_id: str
    partner_id: Optional[str] = None
    status: str
    observation: str
    action_type: str
    draft: str
    reason: str
    tone: str
    source: str
    latency_ms: Optional[int] = None
    snoozed_until: Optional[str] = None
    expires_at: Optional[str] = None
    created_at: str
    # Crisis: chỉ trả kèm khi nudge sinh ra từ safety intervention
    is_crisis: bool = False
    helplines: Optional[list[dict]] = None
    # State machine
    version: int = 1
    snooze_count: int = 0


class SmartNudgeActionRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    action: Literal["completed", "snoozed", "dismissed"]
    version: int | None = Field(default=None, ge=1, strict=True)


class SmartNudgeRatingRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    rating: Literal["thumbs_up", "thumbs_down"]
    # Cho phép cả enum chuẩn lẫn custom text để user mô tả tự do
    feedback_reason: Optional[str] = Field(default=None, max_length=200)


class TinyMomentCreateRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    # couple_id KHÔNG lấy từ client; service tự suy ra từ session
    moment_type: Literal["text", "voice", "photo", "signal"]
    content: Optional[str] = Field(default=None, max_length=200)
    nudge_id: Optional[str] = None
    reply_to: str | None = None
    media_id: str | None = None
    place: str | None = Field(default=None, max_length=80)

    @model_validator(mode='after')
    def validate_content(self):
        if self.moment_type == 'text' and (not self.content or not self.content.strip() or self.media_id):
            raise ValueError('Text requires a message and cannot contain media')
        if self.moment_type == 'signal' and (self.content not in ('miss_you', 'thinking_of_you', 'good_night') or self.media_id):
            raise ValueError('Unknown signal')
        if self.moment_type in ('photo', 'voice') and (not self.media_id or len(self.content or '') > 100):
            raise ValueError('Upload media first; caption limited to 100 characters')
        return self


class TinyMomentReactRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    reaction: Literal['heart', 'hug', 'smile', 'thanks'] | None


__all__ = [
    "ACTION_TYPES",
    "TONES",
    "NUDGE_STATUSES",
    "MOMENT_TYPES",
    "RATINGS",
    "FEEDBACK_REASONS",
]
