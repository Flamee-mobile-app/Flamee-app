from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.api.deps import get_current_user, get_storage
from app.api.response import ok
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.auth import (
    AuthResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    UpdateProfileRequest,
    UserResponse,
)
from app.services.auth_service import AuthService
from app.storage.base import Storage

router = APIRouter(prefix="/auth", tags=["auth"])


def _auth_service(storage: Storage) -> AuthService:
    return AuthService(UserRepository(storage))


def _user_response(user_dict: dict) -> UserResponse:
    return UserResponse(
        id=user_dict["id"],
        email=user_dict["email"],
        full_name=user_dict.get("full_name", ""),
        avatar_url=user_dict.get("avatar_url"),
        couple_id=user_dict.get("couple_id"),
        created_at=user_dict.get("created_at", ""),
    )


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    storage: Storage = Depends(get_storage),
):
    user, token = _auth_service(storage).register(
        payload.email, payload.password, payload.full_name
    )
    return ok(
        AuthResponse(
            user=UserResponse.from_model(user),
            access_token=token,
        ).model_dump()
    )


@router.post("/login")
def login(payload: LoginRequest, storage: Storage = Depends(get_storage)):
    user, token = _auth_service(storage).login(payload.email, payload.password)
    return ok(
        AuthResponse(
            user=UserResponse.from_model(user),
            access_token=token,
        ).model_dump()
    )


@router.get("/me")
def me(current: dict = Depends(get_current_user)):
    return ok(_user_response(current).model_dump())


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current: dict = Depends(get_current_user),
    storage: Storage = Depends(get_storage),
):
    _auth_service(storage).change_password(
        current["id"], payload.current_password, payload.new_password
    )
    return ok({"updated": True})


@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest,
    storage: Storage = Depends(get_storage),
):
    otp, expires_in = _auth_service(storage).forgot_password(payload.email)
    return ok(
        ForgotPasswordResponse(otp=otp, expires_in=expires_in).model_dump()
    )


@router.post("/reset-password")
def reset_password(
    payload: ResetPasswordRequest,
    storage: Storage = Depends(get_storage),
):
    _auth_service(storage).reset_password(
        payload.email, payload.otp, payload.new_password
    )
    return ok({"updated": True})


@router.put("/me")
def update_profile(
    payload: UpdateProfileRequest,
    current: dict = Depends(get_current_user),
    storage: Storage = Depends(get_storage),
):
    user = _auth_service(storage).update_profile(
        user_id=current["id"],
        full_name=payload.full_name,
        avatar_url=payload.avatar_url,
        birth_date=payload.birth_date,
        gender=payload.gender,
    )
    return ok(UserResponse.from_model(user).model_dump())