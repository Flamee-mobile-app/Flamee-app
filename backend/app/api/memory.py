from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, File, Query, UploadFile, status

from app.api.deps import (
    get_current_couple_member,
    get_current_user,
    get_storage,
)
from app.api.response import ok
from app.repositories.couple_repo import CoupleMemberRepository
from app.repositories.memory_repo import MemoryImageRepository, MemoryRepository
from app.schemas.memory import (
    CreateMemoryRequest,
    MemoryListResponse,
    MemoryResponse,
    UpdateMemoryRequest,
)
from app.services.memory_service import MemoryService
from app.storage.base import Storage

router = APIRouter(prefix="/memories", tags=["memories"])


def _service(storage: Storage) -> MemoryService:
    return MemoryService(
        storage=storage,
        memory_repo=MemoryRepository(storage),
        image_repo=MemoryImageRepository(storage),
    )


def _ensure_couple_id(user: dict, storage: Storage) -> str:
    """Return the user's couple_id, raising AuthError if they have none."""
    member = CoupleMemberRepository(storage).find_by_user(user["id"])
    if not member:
        raise LookupError("not_in_couple")
    return member.couple_id


@router.get("")
def list_memories(
    category: str | None = Query(default=None),
    year: int | None = Query(default=None, ge=1900, le=2999),
    current: dict = Depends(get_current_user),
    storage: Storage = Depends(get_storage),
):
    try:
        couple_id = _ensure_couple_id(current, storage)
    except LookupError:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Bạn chưa thuộc couple nào")
    items, total = _service(storage).list_memories(
        couple_id, category=category, year=year
    )
    return ok(
        MemoryListResponse(items=items, total=total).model_dump()
    )


@router.post("", status_code=status.HTTP_201_CREATED)
def create_memory(
    payload: CreateMemoryRequest,
    current: dict = Depends(get_current_user),
    storage: Storage = Depends(get_storage),
):
    try:
        couple_id = _ensure_couple_id(current, storage)
    except LookupError:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Bạn chưa thuộc couple nào")
    memory = _service(storage).create_memory(
        current["id"], couple_id, payload
    )
    images = MemoryImageRepository(storage).find_by_memory(memory.id)
    return ok(MemoryResponse.build(memory, images).model_dump())


@router.get("/{memory_id}")
def get_memory(
    memory_id: str,
    current: dict = Depends(get_current_user),
    storage: Storage = Depends(get_storage),
):
    couple_id = _ensure_couple_id(current, storage)
    memory, images = _service(storage).get_memory(couple_id, memory_id)
    return ok(MemoryResponse.build(memory, images).model_dump())


@router.put("/{memory_id}")
def update_memory(
    memory_id: str,
    payload: UpdateMemoryRequest,
    current: dict = Depends(get_current_user),
    storage: Storage = Depends(get_storage),
):
    couple_id = _ensure_couple_id(current, storage)
    memory = _service(storage).update_memory(
        couple_id, memory_id, payload
    )
    images = MemoryImageRepository(storage).find_by_memory(memory.id)
    return ok(MemoryResponse.build(memory, images).model_dump())


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory(
    memory_id: str,
    current: dict = Depends(get_current_user),
    storage: Storage = Depends(get_storage),
):
    couple_id = _ensure_couple_id(current, storage)
    _service(storage).delete_memory(couple_id, memory_id)
    return None


@router.post(
    "/{memory_id}/images", status_code=status.HTTP_201_CREATED
)
def upload_image(
    memory_id: str,
    file: UploadFile = File(...),
    current: dict = Depends(get_current_user),
    storage: Storage = Depends(get_storage),
):
    couple_id = _ensure_couple_id(current, storage)
    image = _service(storage).upload_image(
        current["id"], couple_id, memory_id, file
    )
    from app.schemas.memory import MemoryImageResponse
    return ok(MemoryImageResponse.from_model(image).model_dump())


@router.delete(
    "/{memory_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_image(
    memory_id: str,
    image_id: str,
    current: dict = Depends(get_current_user),
    storage: Storage = Depends(get_storage),
):
    couple_id = _ensure_couple_id(current, storage)
    _service(storage).delete_image(couple_id, memory_id, image_id)
    return None