from __future__ import annotations

from fastapi import APIRouter, Depends, status
from supabase import Client

from app.api.deps import get_current_user, get_db
from app.api.response import ok
from app.repositories.couple_repo import (
    CoupleRepository,
    InviteCodeRepository,
)
from app.repositories.user_repo import UserRepository
from app.schemas.couple import (
    AcceptInviteRequest,
    CoupleResponse,
    CreateInviteResponse,
    GetInviteResponse,
    MemberInfo,
    UpdateAnniversaryRequest,
)
from app.services.couple_service import CoupleService

router = APIRouter(prefix="/couple", tags=["couple"])


def _service(db: Client) -> CoupleService:
    return CoupleService(
        db=db,
        couple_repo=CoupleRepository(db),
        invite_repo=InviteCodeRepository(db),
        user_repo=UserRepository(db),
    )


def _build_couple_response(user_id: str, db: Client) -> dict:
    svc = _service(db)
    couple, p1_info, p2_info, role = svc.get_couple_for(user_id)
    return ok(
        CoupleResponse.build(
            couple=couple,
            partner1_info=p1_info,
            partner2_info=p2_info,
            my_role=role,
        ).model_dump()
    )


@router.post("/invite-code", status_code=status.HTTP_201_CREATED)
def create_invite(
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    invite = _service(db).create_invite(current["id"])
    return ok(CreateInviteResponse.from_model(invite).model_dump())


@router.get("/invite-code")
def get_invite(
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    invite = _service(db).get_my_invite(current["id"])
    if invite is None:
        return ok(None)
    return ok(GetInviteResponse.from_model(invite).model_dump())


@router.post("/accept-invite")
def accept_invite(
    payload: AcceptInviteRequest,
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    _service(db).accept_invite(current["id"], payload.code)
    return _build_couple_response(current["id"], db)


@router.get("")
def get_couple(
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    return _build_couple_response(current["id"], db)


@router.put("/anniversary")
def update_anniversary(
    payload: UpdateAnniversaryRequest,
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    _service(db).update_anniversary(current["id"], payload.anniversary)
    return _build_couple_response(current["id"], db)

@router.delete("")
def delete_couple(
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    _service(db).break_up(current["id"])
    return ok({"message": "Đã hủy ghép đôi thành công"})