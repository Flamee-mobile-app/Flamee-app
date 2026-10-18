"""Smart Nudge & Tiny Moment endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.api.deps import get_current_user, get_db
from app.api.response import ok
from app.core.exceptions import ForbiddenError, NotFoundError
from app.repositories.smart_nudge_repo import (
    SmartNudgeRepository,
    TinyMomentRepository,
)
from app.schemas.smart_nudge import (
    SmartNudgeActionRequest,
    SmartNudgeRatingRequest,
    SmartNudgeResponse,
    TinyMomentCreateRequest,
)
from app.services.smart_nudge_service import SmartNudgeService

router = APIRouter(tags=["smart_nudges"])


def _nudge_service(db: Client) -> SmartNudgeService:
    return SmartNudgeService(
        SmartNudgeRepository(db),
        TinyMomentRepository(db),
        db_client=db,
    )


def _to_response(nudge) -> SmartNudgeResponse:
    return SmartNudgeResponse(**nudge.to_dict())


@router.get("/nudges/active")
def get_active_nudge(
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    couple_id = current.get("couple_id")
    if not couple_id:
        return ok(None)
    nudge = _nudge_service(db).get_active_nudge(
        couple_id=couple_id, user_id=current["id"]
    )
    if not nudge:
        return ok(None)
    return ok(_to_response(nudge).model_dump())


@router.post("/nudges/{nudge_id}/action")
def perform_nudge_action(
    nudge_id: str,
    payload: SmartNudgeActionRequest,
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    try:
        updated = _nudge_service(db).handle_nudge_action(
            nudge_id=nudge_id,
            user_id=current["id"],
            action=payload.action,
        )
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=exc.message)
    except ForbiddenError as exc:
        raise HTTPException(status_code=403, detail=exc.message)
    return ok(_to_response(updated).model_dump())


@router.post("/nudges/{nudge_id}/rate")
def rate_nudge(
    nudge_id: str,
    payload: SmartNudgeRatingRequest,
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    try:
        ok_flag = _nudge_service(db).rate_nudge(
            nudge_id=nudge_id,
            user_id=current["id"],
            rating=payload.rating,
            feedback_reason=payload.feedback_reason,
        )
    except ForbiddenError as exc:
        raise HTTPException(status_code=403, detail=exc.message)
    if not ok_flag:
        raise HTTPException(status_code=400, detail="Không thể ghi nhận đánh giá.")
    return ok({"rated": True})


@router.post("/tiny-moments", status_code=status.HTTP_201_CREATED)
def create_tiny_moment(
    payload: TinyMomentCreateRequest,
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    couple_id = current.get("couple_id")
    if not couple_id:
        raise HTTPException(
            status_code=400,
            detail="Bạn cần ghép đôi trước khi gửi Tiny Moment.",
        )
    moment = _nudge_service(db).send_tiny_moment(
        couple_id=couple_id,
        sender_id=current["id"],
        moment_type=payload.moment_type,
        content=payload.content,
        nudge_id=payload.nudge_id,
    )
    return ok(moment.to_dict())


@router.get("/tiny-moments")
def get_tiny_moments(
    limit: int = 20,
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    couple_id = current.get("couple_id")
    if not couple_id:
        return ok([])
    moments = TinyMomentRepository(db).get_recent(couple_id, limit=limit)
    return ok([m.to_dict() for m in moments])