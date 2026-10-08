from fastapi import APIRouter, Depends, status
from supabase import Client

from app.api.deps import get_current_user, get_db
from app.api.response import ok
from app.services.user_service import UserService
from app.schemas.user import (
    UserProfileResponse,
    UpdateProfileRequest,
    UpdatePasswordRequest,
    UpdateDeviceTokenRequest
)

router = APIRouter(prefix="/users", tags=["user"])

def get_user_service(db: Client = Depends(get_db)) -> UserService:
    return UserService(db)

@router.get("/me")
def get_my_profile(
    current: dict = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    user = user_service.get_user(current["id"])
    return ok(UserProfileResponse.from_model(user).model_dump())

@router.put("/me")
def update_my_profile(
    payload: UpdateProfileRequest,
    current: dict = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    user = user_service.update_profile(
        user_id=current["id"],
        full_name=payload.full_name,
        avatar_url=payload.avatar_url,
        birth_date=payload.birth_date,
        gender=payload.gender
    )
    return ok(UserProfileResponse.from_model(user).model_dump())

@router.put("/me/password")
def update_my_password(
    payload: UpdatePasswordRequest,
    current: dict = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    user_service.update_password(current["id"], payload.new_password)
    return ok({"message": "Đổi mật khẩu thành công"})

@router.post("/me/device-token")
def update_device_token(
    payload: UpdateDeviceTokenRequest,
    current: dict = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    user = user_service.update_fcm_token(current["id"], payload.fcm_token)
    return ok(UserProfileResponse.from_model(user).model_dump())
