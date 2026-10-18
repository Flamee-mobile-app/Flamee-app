from pydantic import BaseModel, Field
from typing import Optional
from app.schemas.common import Username

class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    username: Optional[str] = None
    nickname: Optional[str] = None
    timezone: str = "Asia/Ho_Chi_Minh"
    avatar_url: Optional[str] = None
    birth_date: Optional[str] = None
    gender: Optional[str] = None
    couple_id: Optional[str] = None
    fcm_token: Optional[str] = None
    created_at: str

    @classmethod
    def from_model(cls, model) -> "UserProfileResponse":
        return cls(
            id=model.id,
            email=model.email,
            full_name=model.full_name,
            username=model.username,
            nickname=model.nickname,
            timezone=model.timezone,
            avatar_url=model.avatar_url,
            birth_date=model.birth_date,
            gender=model.gender,
            couple_id=model.couple_id,
            fcm_token=model.fcm_token,
            created_at=model.created_at
        )

class UpdateProfileRequest(BaseModel):
    username: Optional[Username] = None
    nickname: Optional[str] = Field(None, max_length=120)
    timezone: Optional[str] = Field(None, min_length=1, max_length=100)
    full_name: Optional[str] = Field(None, min_length=2)
    avatar_url: None = Field(default=None, description="Use POST /auth/me/avatar")
    birth_date: Optional[str] = None
    gender: Optional[str] = None

class UpdatePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=6)

class UpdateDeviceTokenRequest(BaseModel):
    fcm_token: str = Field(..., description="Firebase Cloud Messaging Token")
