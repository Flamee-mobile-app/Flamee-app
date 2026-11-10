"""Smart Nudge & Tiny Moment endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Header, Query, File, Form, UploadFile, HTTPException, status
from typing import Literal
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
    TinyMomentReactRequest,
)
from app.services.smart_nudge_service import SmartNudgeService

from app.services.tiny_moment_service import PrivateMomentService

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
            version=payload.version,
        )
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=exc.message)
    except ForbiddenError as exc:
        raise HTTPException(status_code=403, detail=exc.message)
    return ok(_to_response(updated).model_dump())


@router.get('/nudges/{nudge_id}')
def get_nudge(nudge_id: str, current: dict = Depends(get_current_user), db: Client = Depends(get_db)):
    return ok(_to_response(_nudge_service(db).get_nudge(nudge_id, current['id'])).model_dump())


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


@router.post("/tiny-moments", status_code=201)
def create_tiny_moment(payload: TinyMomentCreateRequest,
    request_key: str = Header(alias="Idempotency-Key", min_length=1, max_length=120, pattern=r"^[A-Za-z0-9_-]+$"),
    current: dict = Depends(get_current_user), db: Client = Depends(get_db)):
    return ok(PrivateMomentService(db).create(current['id'], payload, request_key))


@router.post('/tiny-moments/media', status_code=201)
def upload_tiny_moment_media(kind: Literal['photo','voice'] = Form(...), file: UploadFile = File(...),
    request_key: str = Header(alias='Idempotency-Key', min_length=1,max_length=120,pattern=r'^[A-Za-z0-9_-]+$'),
    current: dict = Depends(get_current_user), db: Client = Depends(get_db)):
    from app.services.tiny_moment_media import upload_moment_media
    pair = PrivateMomentService(db).require_pair(current['id'])
    return ok(upload_moment_media(db, current['id'], pair, kind, file.file, request_key))


@router.get("/tiny-moments")
def get_tiny_moments(limit: int = Query(default=20, ge=1, le=100), offset: int = Query(default=0, ge=0),
    current: dict = Depends(get_current_user), db: Client = Depends(get_db)):
    return ok(PrivateMomentService(db).list(current['id'], limit, offset))


@router.get("/tiny-moments/{moment_id}")
def get_tiny_moment(moment_id: str, current: dict = Depends(get_current_user), db: Client = Depends(get_db)):
    return ok(PrivateMomentService(db).get(current['id'], moment_id))


@router.get('/tiny-moments/{moment_id}/media')
def get_tiny_media(moment_id: str, current: dict = Depends(get_current_user), db: Client = Depends(get_db)):
    from fastapi.responses import Response
    content, mime = PrivateMomentService(db).media(current['id'], moment_id)
    return Response(content, media_type=mime, headers={
        'Cache-Control': 'no-store, private', 'Pragma': 'no-cache',
        'Vary': 'Authorization', 'X-Content-Type-Options': 'nosniff',
    })


@router.delete('/tiny-moments/media/{media_id}',status_code=204)
def discard_tiny_media(media_id:str,current:dict=Depends(get_current_user),db:Client=Depends(get_db)):
    PrivateMomentService(db).discard_media(current['id'],media_id)


@router.post("/tiny-moments/{moment_id}/reactions")
def react_tiny_moment(moment_id: str, payload: TinyMomentReactRequest,
    current: dict = Depends(get_current_user), db: Client = Depends(get_db)):
    return ok(PrivateMomentService(db).change(current['id'], moment_id, 'react', payload.model_dump()))


@router.post("/tiny-moments/{moment_id}/read")
def read_tiny_moment(moment_id: str, current: dict = Depends(get_current_user), db: Client = Depends(get_db)):
    return ok(PrivateMomentService(db).change(current['id'], moment_id, 'read'))


@router.delete("/tiny-moments/{moment_id}", status_code=204)
def delete_tiny_moment(moment_id: str, current: dict = Depends(get_current_user), db: Client = Depends(get_db)):
    PrivateMomentService(db).change(current['id'], moment_id, 'delete')
