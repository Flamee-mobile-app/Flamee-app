from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.api.deps import get_current_user, get_db
from app.api.response import ok
from app.schemas.mood import CreateMoodRequest, MoodResponse, PartnerMoodStatusResponse
from app.services.mood_service import MoodService
from app.services.couple_service import CoupleService
from app.repositories.couple_repo import CoupleRepository, InviteCodeRepository
from app.repositories.user_repo import UserRepository

router = APIRouter(prefix="/moods", tags=["mood"])

def get_mood_service(db: Client = Depends(get_db)) -> MoodService:
    return MoodService(db)

def get_couple_service(db: Client = Depends(get_db)) -> CoupleService:
    return CoupleService(
        db=db,
        couple_repo=CoupleRepository(db),
        invite_repo=InviteCodeRepository(db),
        user_repo=UserRepository(db),
    )

@router.post("", status_code=status.HTTP_201_CREATED)
def create_mood(
    payload: CreateMoodRequest,
    current: dict = Depends(get_current_user),
    mood_service: MoodService = Depends(get_mood_service)
):
    couple_id = current.get("couple_id")
    if not couple_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn cần ghép đôi trước khi sử dụng tính năng này."
        )
        
    mood = mood_service.create_mood(
        couple_id=couple_id,
        user_id=current["id"],
        mood=payload.mood,
        intensity=payload.intensity,
        note=payload.note,
        is_private=payload.is_private
    )
    return ok(MoodResponse.from_model(mood).model_dump())

@router.get("")
def get_my_moods(
    current: dict = Depends(get_current_user),
    mood_service: MoodService = Depends(get_mood_service)
):
    moods = mood_service.get_my_moods(current["id"])
    return ok([MoodResponse.from_model(m).model_dump() for m in moods])

@router.get("/partner/latest")
def get_partner_latest_mood(
    current: dict = Depends(get_current_user),
    mood_service: MoodService = Depends(get_mood_service),
    couple_service: CoupleService = Depends(get_couple_service)
):
    couple_id = current.get("couple_id")
    if not couple_id:
        return ok(None)
        
    couple, p1_info, p2_info, role = couple_service.get_couple_for(current["id"])
    
    partner_id = p1_info.id if role == "partner2" else (p2_info.id if p2_info else None)
    
    if not partner_id:
        return ok(None)
        
    latest_mood, active_alert = mood_service.get_partner_latest_mood_and_alert(partner_id)
    
    return ok(PartnerMoodStatusResponse(
        partner_id=partner_id,
        latest_mood=MoodResponse.from_model(latest_mood) if latest_mood else None,
        active_alert=active_alert # pydantic v2 tự cast dataclass nếu các field map đúng
    ).model_dump())

@router.post("/alerts/{alert_id}/read")
def mark_alert_read(
    alert_id: str,
    current: dict = Depends(get_current_user),
    mood_service: MoodService = Depends(get_mood_service)
):
    mood_service.mark_alert_read(alert_id)
    return ok({"status": "success"})
