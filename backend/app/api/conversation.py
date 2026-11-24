from fastapi import APIRouter, Depends, Header, Query
from app.api.deps import get_current_user, get_db
from app.api.response import ok
from app.repositories.conversation_repo import ConversationRepository
from app.schemas.conversation import CommentCreate, CommentEdit
from app.services.conversation_service import ConversationService

router = APIRouter(tags=["conversation"])


def service(db=Depends(get_db)):
    return ConversationService(ConversationRepository(db))


@router.get("/memories/{memory_id}/comments")
def comments(memory_id: str, limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0), current=Depends(get_current_user), operations=Depends(service)):
    return ok(operations.read(current["id"], "list", memory_id, limit=limit, offset=offset))


@router.post("/memories/{memory_id}/comments", status_code=201)
def create_comment(memory_id: str, payload: CommentCreate, key: str = Header(alias="Idempotency-Key", min_length=1, max_length=120, pattern=r"^[A-Za-z0-9_-]+$"), current=Depends(get_current_user), operations=Depends(service)):
    return ok(operations.change(current["id"], "create", memory_id, key=key, payload=payload.model_dump()))


@router.put("/memories/{memory_id}/comments/{comment_id}")
def edit_comment(memory_id: str, comment_id: str, payload: CommentEdit, current=Depends(get_current_user), operations=Depends(service)):
    return ok(operations.change(current["id"], "edit", memory_id, comment_id, payload=payload.model_dump(exclude={"parent_id"})))


@router.get("/memories/{memory_id}/comments/{comment_id}")
def get_comment(memory_id: str, comment_id: str, current=Depends(get_current_user), operations=Depends(service)):
    return ok(operations.change(current["id"], "comment", memory_id, comment_id))


@router.delete("/memories/{memory_id}/comments/{comment_id}")
def delete_comment(memory_id: str, comment_id: str, version: int = Query(ge=0), current=Depends(get_current_user), operations=Depends(service)):
    return ok(operations.change(current["id"], "delete", memory_id, comment_id, payload={"version": version}))


@router.put("/memories/{memory_id}/comments/{comment_id}/heart")
def heart_comment(memory_id: str, comment_id: str, current=Depends(get_current_user), operations=Depends(service)):
    return ok(operations.change(current["id"], "heart", memory_id, comment_id))


@router.delete("/memories/{memory_id}/comments/{comment_id}/heart")
def unheart_comment(memory_id: str, comment_id: str, current=Depends(get_current_user), operations=Depends(service)):
    return ok(operations.change(current["id"], "unheart", memory_id, comment_id))


@router.get("/notifications")
def inbox(limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0), current=Depends(get_current_user), operations=Depends(service)):
    return ok(operations.read(current["id"], "inbox", limit=limit, offset=offset))


@router.put("/notifications/read-all")
def read_all(current=Depends(get_current_user), operations=Depends(service)):
    return ok(operations.change(current["id"], "read_all"))


@router.put("/notifications/{notification_id}/read")
def read_notification(notification_id: str, current=Depends(get_current_user), operations=Depends(service)):
    return ok(operations.change(current["id"], "read", target=notification_id))
