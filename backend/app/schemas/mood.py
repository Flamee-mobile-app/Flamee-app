from pydantic import BaseModel, Field
from typing import Optional

class CreateMoodRequest(BaseModel):
    mood: str = Field(..., description="Cảm xúc (ví dụ: happy, sad, angry, relaxed, excited)")
    intensity: int = Field(..., ge=1, le=10, description="Mức độ cảm xúc từ 1 đến 10")
    note: Optional[str] = Field(None, description="Ghi chú chi tiết về cảm xúc")
    is_private: bool = Field(False, description="Chỉ mình tôi xem")

class MoodResponse(BaseModel):
    id: str
    mood: str
    intensity: int
    note: Optional[str]
    is_private: bool
    created_at: str
    
    @classmethod
    def from_model(cls, model) -> "MoodResponse":
        return cls(
            id=model.id,
            mood=model.mood,
            intensity=model.intensity,
            note=model.note,
            is_private=model.is_private,
            created_at=model.created_at
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
            created_at=model.created_at
        )

class PartnerMoodStatusResponse(BaseModel):
    partner_id: str
    latest_mood: Optional[MoodResponse]
    active_alert: Optional[MoodAlertResponse]
