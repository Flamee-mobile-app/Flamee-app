from dataclasses import dataclass
from typing import Optional

@dataclass
class Mood:
    id: str
    couple_id: str
    user_id: str
    mood: str
    intensity: int
    note: Optional[str]
    is_private: bool
    created_at: str

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
