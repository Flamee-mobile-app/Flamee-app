from dataclasses import dataclass, field
from typing import Optional

@dataclass
class Mood:
    id: str
    couple_id: Optional[str]
    user_id: str
    mood: str
    intensity: int
    note: Optional[str]
    is_private: bool
    created_at: str
    mood_score: int = 3
    reasons: Optional[list[str]] = None
    share_level: str = "all"
    draft_version: int = 1
    custom_emotion_label: Optional[str] = None
    mascot_sticker_id: Optional[str] = None
    sleep_hours: Optional[int] = None
    attachments: list[dict] = field(default_factory=list)
    timezone: str = "UTC"
    local_date: Optional[str] = None

@dataclass
class MoodAlert:
    id: str
    couple_id: str
    user_id: str
    alert_type: str
    title: str
    message: str
    advice: str
    is_read: bool
    created_at: str
