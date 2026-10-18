from __future__ import annotations

from typing import Any

from pydantic import BaseModel, EmailStr, Field

from app.models.user import User
from app.schemas.common import Username


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: str = Field(min_length=1, max_length=120)
    username: Username | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    username: str | None = None
    avatar_url: str | None = None
    couple_id: str | None = None
    created_at: str

    @classmethod
    def from_model(cls, user: User) -> "UserResponse":
        return cls(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            username=user.username,
            avatar_url=user.avatar_url,
            couple_id=user.couple_id,
            created_at=user.created_at,
        )


class AuthResponse(BaseModel):
    user: UserResponse
    access_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=4, max_length=10)
    new_password: str = Field(min_length=6, max_length=128)


class UpdateProfileRequest(BaseModel):
    username: Username | None = None
    full_name: str | None = Field(default=None, min_length=1, max_length=120)
    avatar_url: None = Field(default=None, description="Use POST /auth/me/avatar")
    birth_date: str | None = None
    gender: str | None = Field(default=None, max_length=20)


def user_dict_to_response(user_dict: dict[str, Any]) -> UserResponse:
    """Convert a raw storage record dict into a UserResponse."""
    return UserResponse(
        id=user_dict["id"],
        email=user_dict["email"],
        full_name=user_dict.get("full_name", ""),
        username=user_dict.get("username"),
        avatar_url=user_dict.get("avatar_url"),
        couple_id=user_dict.get("couple_id"),
        created_at=user_dict.get("created_at", ""),
    )
