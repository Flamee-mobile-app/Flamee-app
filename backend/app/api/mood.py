"""Mood check-in & partner status endpoints."""
from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from supabase import Client

from app.api.deps import get_couple_service, get_current_user, get_db, get_mood_service
from app.api.response import ok
from app.core.exceptions import ValidationError
from app.schemas.mood import (
    CreateMoodRequest,
    MoodAlertResponse,
    MoodResponse,
    PartnerMoodStatusResponse,
)
from app.services.couple_service import CoupleService
from app.services.mood_service import MoodService

router = APIRouter(prefix="/moods", tags=["mood"])


def _mood_response(mood) -> MoodResponse:
    return MoodResponse.from_model(mood)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_mood(
    payload: CreateMoodRequest,
    background_tasks: BackgroundTasks,
    current: dict = Depends(get_current_user),
    mood_service: MoodService = Depends(get_mood_service),
):
    couple_id = current.get("couple_id")
    if not couple_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn cần ghép đôi trước khi sử dụng tính năng này.",
        )

    try:
        mood = mood_service.create_mood(
            couple_id=couple_id,
            user_id=current["id"],
            mood=payload.mood,
            intensity=payload.intensity,
            note=payload.note,
            is_private=payload.is_private,
            background_tasks=background_tasks,
            mood_score=payload.mood_score,
            reasons=payload.reasons,
            share_level=payload.share_level,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return ok(_mood_response(mood).model_dump())


@router.get("")
def get_my_moods(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current: dict = Depends(get_current_user),
    mood_service: MoodService = Depends(get_mood_service),
):
    moods = mood_service.get_my_moods(current["id"], limit=limit, offset=offset)
    return ok([_mood_response(m).model_dump() for m in moods])


@router.get("/partner/latest")
def get_partner_latest_mood(
    current: dict = Depends(get_current_user),
    mood_service: MoodService = Depends(get_mood_service),
    couple_service: CoupleService = Depends(get_couple_service),
):
    couple_id = current.get("couple_id")
    if not couple_id:
        return ok(None)

    couple, p1_info, p2_info, role = couple_service.get_couple_for(current["id"])
    partner_id = (
        p1_info.id
        if role == "partner2"
        else (p2_info.id if p2_info else None)
    )
    if not partner_id:
        return ok(None)

    latest_mood, active_alert = mood_service.get_partner_latest_mood_and_alert(
        partner_id, couple_id=couple_id
    )
    return ok(
        PartnerMoodStatusResponse(
            partner_id=partner_id,
            latest_mood=_mood_response(latest_mood) if latest_mood else None,
            active_alert=MoodAlertResponse.from_model(active_alert)
            if active_alert
            else None,
        ).model_dump()
    )


@router.post("/alerts/{alert_id}/read")
def mark_alert_read(
    alert_id: str,
    current: dict = Depends(get_current_user),
    mood_service: MoodService = Depends(get_mood_service),
):
    """Chỉ đánh dấu nếu alert thuộc về user hiện tại."""
    ok_flag = mood_service.mark_alert_read(alert_id, current["id"])
    if not ok_flag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy alert hoặc không có quyền.",
        )
    return ok({"status": "success"})


@router.delete("/{mood_id}")
def delete_mood(
    mood_id: str,
    current: dict = Depends(get_current_user),
    mood_service: MoodService = Depends(get_mood_service),
):
    success = mood_service.delete_mood(mood_id, current["id"])
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy cảm xúc hoặc không có quyền xóa",
        )
    return ok({"status": "success"})
