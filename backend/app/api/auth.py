from __future__ import annotations

from fastapi import APIRouter, Depends, status
from supabase import Client

from app.api.deps import get_current_user, get_db
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

router = APIRouter(prefix="/auth", tags=["auth"])


def _auth_service(db: Client) -> AuthService:
    return AuthService(UserRepository(db))


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    db: Client = Depends(get_db),
):
    user, token = _auth_service(db).register(
        payload.email, payload.password, payload.full_name
    )
    return ok(
        AuthResponse(
            user=UserResponse.from_model(user),
            access_token=token,
        ).model_dump()
    )


@router.post("/login")
def login(payload: LoginRequest, db: Client = Depends(get_db)):
    user, token = _auth_service(db).login(payload.email, payload.password)
    return ok(
        AuthResponse(
            user=UserResponse.from_model(user),
            access_token=token,
        ).model_dump()
    )


@router.get("/me")
def me(current: dict = Depends(get_current_user)):
    return ok(
        UserResponse(
            id=current["id"],
            email=current["email"],
            full_name=current.get("full_name", ""),
            avatar_url=current.get("avatar_url"),
            couple_id=current.get("couple_id"),
            created_at=current.get("created_at", ""),
        ).model_dump()
    )


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    _auth_service(db).change_password(
        current["id"], payload.current_password, payload.new_password
    )
    return ok({"updated": True})


@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Client = Depends(get_db),
):
    otp, expires_in = _auth_service(db).forgot_password(payload.email)
    return ok(
        ForgotPasswordResponse(otp=otp, expires_in=expires_in).model_dump()
    )


@router.post("/reset-password")
def reset_password(
    payload: ResetPasswordRequest,
    db: Client = Depends(get_db),
):
    _auth_service(db).reset_password(
        payload.email, payload.otp, payload.new_password
    )
    return ok({"updated": True})


@router.put("/me")
def update_profile(
    payload: UpdateProfileRequest,
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    user = _auth_service(db).update_profile(
        user_id=current["id"],
        full_name=payload.full_name,
        avatar_url=payload.avatar_url,
        birth_date=payload.birth_date,
        gender=payload.gender,
    )
    return ok(UserResponse.from_model(user).model_dump())