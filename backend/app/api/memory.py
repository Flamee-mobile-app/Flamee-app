from __future__ import annotations

from fastapi import APIRouter, Depends, File, Query, UploadFile, status, BackgroundTasks
from supabase import Client

from app.api.deps import get_current_user, get_db
from app.api.response import ok
from app.core.exceptions import NotFoundError

from app.repositories.memory_repo import MemoryImageRepository, MemoryRepository
from app.schemas.memory import (
    CreateMemoryRequest,
    MemoryImageResponse,
    MemoryListResponse,
    MemoryResponse,
    UpdateMemoryRequest,
)
from app.services.memory_service import MemoryService

router = APIRouter(prefix="/memories", tags=["memories"])


def _service(db: Client) -> MemoryService:
    return MemoryService(
        db=db,
        memory_repo=MemoryRepository(db),
        image_repo=MemoryImageRepository(db),
    )


def _ensure_couple_id(user: dict) -> str:
    """Return the user's couple_id, raising NotFoundError if they have none."""
    couple_id = user.get("couple_id")
    if not couple_id:
        raise NotFoundError("Bạn chưa thuộc couple nào")
    return couple_id


@router.get("")
def list_memories(
    category: str | None = Query(default=None),
    year: int | None = Query(default=None, ge=1900, le=2999),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    couple_id = _ensure_couple_id(current)
    items, total, has_more = _service(db).list_memories(
        couple_id, category=category, year=year, limit=limit, offset=offset
    )
    return ok(
        MemoryListResponse(
            items=items, total=total, limit=limit, offset=offset, has_more=has_more
        ).model_dump()
    )


@router.post("", status_code=status.HTTP_201_CREATED)
def create_memory(
    payload: CreateMemoryRequest,
    background_tasks: BackgroundTasks,
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    couple_id = _ensure_couple_id(current)
    memory = _service(db).create_memory(
        current["id"], couple_id, payload, background_tasks
    )
    images = MemoryImageRepository(db).find_by_memory(memory.id)
    return ok(MemoryResponse.build(memory, images).model_dump())


@router.get("/{memory_id}")
def get_memory(
    memory_id: str,
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    couple_id = _ensure_couple_id(current)
    memory, images = _service(db).get_memory(couple_id, memory_id)
    return ok(MemoryResponse.build(memory, images).model_dump())


@router.put("/{memory_id}")
def update_memory(
    memory_id: str,
    payload: UpdateMemoryRequest,
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    couple_id = _ensure_couple_id(current)
    memory = _service(db).update_memory(
        couple_id, memory_id, payload
    )
    images = MemoryImageRepository(db).find_by_memory(memory.id)
    return ok(MemoryResponse.build(memory, images).model_dump())


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory(
    memory_id: str,
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    couple_id = _ensure_couple_id(current)
    _service(db).delete_memory(couple_id, memory_id)
    return None


@router.post(
    "/{memory_id}/images", status_code=status.HTTP_201_CREATED
)
def upload_image(
    memory_id: str,
    file: UploadFile = File(...),
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    couple_id = _ensure_couple_id(current)
    image = _service(db).upload_image(
        current["id"], couple_id, memory_id, file
    )
    return ok(MemoryImageResponse.from_model(image).model_dump())


@router.delete(
    "/{memory_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_image(
    memory_id: str,
    image_id: str,
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    couple_id = _ensure_couple_id(current)
    _service(db).delete_image(couple_id, memory_id, image_id)
    return None