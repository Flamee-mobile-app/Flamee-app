from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from typing import Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
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


CarePreference = Literal['encouragement', 'voice', 'photo', 'call', 'space', 'gift']


class PreferencesValue(BaseModel):
    model_config = ConfigDict(extra='forbid')
    timezone: str = Field(default='Asia/Ho_Chi_Minh', min_length=1, max_length=100)
    locale: Literal['vi', 'en'] = 'vi'
    care_preferences: list[CarePreference] = Field(default_factory=list, max_length=6)
    care_note: str = Field(default='', max_length=140)
    partner_nickname: str = Field(default='', max_length=40)
    relationship_type: Literal['long_distance', 'same_city'] | None = None

    @field_validator('timezone')
    @classmethod
    def valid_timezone(cls, value):
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError):
            raise ValueError('Invalid IANA timezone') from None
        return value

    @field_validator('care_preferences')
    @classmethod
    def unique_preferences(cls, value):
        if len(value) != len(set(value)):
            raise ValueError('Duplicate care preference')
        return value


class UpdatePreferencesRequest(PreferencesValue):
    revision: int = Field(ge=0, strict=True)
    complete_onboarding: bool = False

    @model_validator(mode='after')
    def require_relationship(self):
        if self.complete_onboarding and self.relationship_type is None:
            raise ValueError('Relationship type required to complete onboarding')
        return self


class PreferencesResponse(PreferencesValue):
    revision: int = Field(ge=0)
    onboarding_completed_at: str | None = None
