"""Schemas cho Mood check-in và Mood Alerts."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.core.constants import MoodType
from app.models.mood import Mood, MoodAlert

# === Validation limits (phải khớp mood_service) ===
MAX_NOTE_LEN = 140
MAX_REASONS = 3
SHARE_LEVELS = ("all", "mood_only", "private")
ALLOWED_MOODS = tuple(m.value for m in MoodType)


class CreateMoodRequest(BaseModel):
    mood: str = Field(
        default="happy",
        min_length=1,
        max_length=32,
        description="Tên cảm xúc (love, happy, sad, ...)",
    )
    intensity: int = Field(default=5, ge=1, le=10)
    note: Optional[str] = Field(default=None, max_length=MAX_NOTE_LEN)
    is_private: bool = False
    mood_score: int = Field(default=3, ge=1, le=5)
    reasons: Optional[list[str]] = Field(default=None, max_length=MAX_REASONS)
    share_level: str = Field(default="all")

    @field_validator("mood")
    @classmethod
    def _validate_mood(cls, v: str) -> str:
        """Enum mood — chỉ chấp nhận giá trị trong MoodType."""
        cleaned = v.strip().lower()
        if cleaned not in ALLOWED_MOODS:
            raise ValueError(
                f"mood phải là một trong {list(ALLOWED_MOODS)}"
            )
        return cleaned

    @field_validator("share_level")
    @classmethod
    def _validate_share_level(cls, v: str) -> str:
        if v not in SHARE_LEVELS:
            raise ValueError(
                f"share_level phải là một trong {list(SHARE_LEVELS)}"
            )
        return v


class MoodResponse(BaseModel):
    id: str
    mood: str
    intensity: int
    note: Optional[str]
    is_private: bool
    created_at: str
    mood_score: int = 3
    reasons: Optional[list[str]] = None
    share_level: str = "all"

    @classmethod
    def from_model(cls, model) -> "MoodResponse":
        return cls(
            id=model.id,
            mood=model.mood,
            intensity=model.intensity,
            note=model.note,
            is_private=model.is_private,
            created_at=model.created_at,
            mood_score=getattr(model, "mood_score", 3),
            reasons=getattr(model, "reasons", None),
            share_level=getattr(model, "share_level", "all"),
        )


class MoodAlertResponse(BaseModel):
    id: str
    alert_type: str
    title: str
    message: str
    advice: str
    is_read: bool
    created_at: str

    @classmethod
    def from_model(cls, model) -> "MoodAlertResponse":
        return cls(
            id=model.id,
            alert_type=model.alert_type,
            title=model.title,
            message=model.message,
            advice=model.advice,
            is_read=model.is_read,
            created_at=model.created_at,
        )


class PartnerMoodStatusResponse(BaseModel):
    partner_id: str
    latest_mood: Optional[MoodResponse]
    active_alert: Optional[MoodAlertResponse]
