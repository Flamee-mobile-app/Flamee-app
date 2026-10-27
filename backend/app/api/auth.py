from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, File, UploadFile, status
from supabase import Client

from app.api.deps import get_current_user, get_db
from app.api.response import ok
from app.core.exceptions import FeatureUnavailableError
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.auth import (
    AuthResponse,
    RefreshRequest,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    UpdateProfileRequest,
    UserResponse,
)
from app.services.auth_service import AuthService
from app.services.avatar_service import AvatarService

router = APIRouter(prefix="/auth", tags=["auth"])


def _auth_service(db: Client) -> AuthService:
    return AuthService(UserRepository(db))


def _present_user(db: Client, user: User) -> User:
    return AvatarService(db, UserRepository(db)).present(user)


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    db: Client = Depends(get_db),
):
    user, token = _auth_service(db).register(
        payload.email, payload.password, payload.full_name, username=payload.username
    )
    return ok(
        AuthResponse(
            user=UserResponse.from_model(_present_user(db, user)),
            **token,
        ).model_dump()
    )


@router.post("/login")
def login(payload: LoginRequest, db: Client = Depends(get_db)):
    user, token = _auth_service(db).login(payload.email, payload.password)
    return ok(
        AuthResponse(
            user=UserResponse.from_model(_present_user(db, user)),
            **token,
        ).model_dump()
    )


@router.post("/refresh")
def refresh(payload: RefreshRequest, db: Client = Depends(get_db)):
    user, tokens = _auth_service(db).refresh(payload.refresh_token)
    return ok(AuthResponse(user=UserResponse.from_model(_present_user(db, user)), **tokens).model_dump())


@router.post("/logout")
def logout(current: dict = Depends(get_current_user), db: Client = Depends(get_db)):
    _auth_service(db).logout(current["id"], current["__jti__"])
    return ok({"logged_out": True})


@router.get("/me")
def me(
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    user = _present_user(db, User.from_dict(current))
    return ok(UserResponse.from_model(user).model_dump())


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
):
    raise FeatureUnavailableError("Khôi phục mật khẩu chưa khả dụng; chưa có kênh gửi mã xác minh.")


@router.post("/reset-password")
def reset_password(
    payload: ResetPasswordRequest,
):
    raise FeatureUnavailableError("Khôi phục mật khẩu chưa khả dụng; mật khẩu chưa được thay đổi.")


@router.put("/me")
def update_profile(
    payload: UpdateProfileRequest,
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    user = _auth_service(db).update_profile(
        user_id=current["id"],
        full_name=payload.full_name,
        birth_date=payload.birth_date,
        gender=payload.gender,
        username=payload.username,
        nickname=payload.nickname,
        timezone=payload.timezone,
    )
    return ok(UserResponse.from_model(_present_user(db, user)).model_dump())


@router.post("/me/avatar")
def upload_avatar(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    user = AvatarService(db).upload(current["id"], file, schedule_cleanup=background_tasks.add_task)
    return ok(UserResponse.from_model(user).model_dump())


@router.delete("/me/avatar")
def delete_avatar(
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    user = AvatarService(db).delete(current["id"])
    return ok(UserResponse.from_model(user).model_dump())
