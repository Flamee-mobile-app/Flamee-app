from fastapi import APIRouter, Depends
from supabase import Client

from app.api.deps import get_current_user, get_db
from app.api.response import ok
from app.services.feed_service import FeedService

router = APIRouter(prefix="/feed", tags=["feed"])

def get_feed_service(db: Client = Depends(get_db)) -> FeedService:
    return FeedService(db)

@router.get("/home")
def get_home_feed(
    current: dict = Depends(get_current_user),
    feed_service: FeedService = Depends(get_feed_service)
):
    data = feed_service.get_home_feed(current["id"])
    return ok(data)
