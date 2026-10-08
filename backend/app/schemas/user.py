from pydantic import BaseModel, Field
from typing import Optional

class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
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
            avatar_url=model.avatar_url,
            birth_date=model.birth_date,
            gender=model.gender,
            couple_id=model.couple_id,
            fcm_token=model.fcm_token,
            created_at=model.created_at
        )

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2)
    avatar_url: Optional[str] = None
    birth_date: Optional[str] = None
    gender: Optional[str] = None

class UpdatePasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=6)

class UpdateDeviceTokenRequest(BaseModel):
    fcm_token: str = Field(..., description="Firebase Cloud Messaging Token")
