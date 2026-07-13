from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.api.deps import get_current_user, get_storage
from app.api.response import ok
from app.models.user import User
from app.repositories.couple_repo import (
    CoupleMemberRepository,
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
from app.storage.base import Storage

router = APIRouter(prefix="/couple", tags=["couple"])


def _service(storage: Storage) -> CoupleService:
    return CoupleService(
        storage=storage,
        couple_repo=CoupleRepository(storage),
        member_repo=CoupleMemberRepository(storage),
        invite_repo=InviteCodeRepository(storage),
        user_repo=UserRepository(storage),
    )


def _build_couple_response(
    user_id: str, storage: Storage
) -> dict:
    svc = _service(storage)
    couple, members, role = svc.get_couple_for(user_id)
    user_repo = UserRepository(storage)
    lookup: dict[str, MemberInfo] = {}
    for member in members:
        user = user_repo.get(member.user_id)
        if user is None:
            continue
        lookup[user.id] = MemberInfo(
            id=user.id,
            full_name=user.full_name,
            avatar_url=user.avatar_url,
        )
    return ok(
        CoupleResponse.build(
            couple=couple,
            members=members,
            member_user_lookup=lookup,
            my_role=role,
        ).model_dump()
    )


@router.post("/invite-code", status_code=status.HTTP_201_CREATED)
def create_invite(
    current: dict = Depends(get_current_user),
    storage: Storage = Depends(get_storage),
):
    invite = _service(storage).create_invite(current["id"])
    return ok(CreateInviteResponse.from_model(invite).model_dump())


@router.get("/invite-code")
def get_invite(
    current: dict = Depends(get_current_user),
    storage: Storage = Depends(get_storage),
):
    invite = _service(storage).get_my_invite(current["id"])
    if invite is None:
        return ok(None)
    return ok(GetInviteResponse.from_model(invite).model_dump())


@router.post("/accept-invite")
def accept_invite(
    payload: AcceptInviteRequest,
    current: dict = Depends(get_current_user),
    storage: Storage = Depends(get_storage),
):
    _service(storage).accept_invite(current["id"], payload.code)
    return _build_couple_response(current["id"], storage)


@router.get("")
def get_couple(
    current: dict = Depends(get_current_user),
    storage: Storage = Depends(get_storage),
):
    return _build_couple_response(current["id"], storage)


@router.put("/anniversary")
def update_anniversary(
    payload: UpdateAnniversaryRequest,
    current: dict = Depends(get_current_user),
    storage: Storage = Depends(get_storage),
):
    _service(storage).update_anniversary(current["id"], payload.anniversary)
    return _build_couple_response(current["id"], storage)