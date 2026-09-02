from supabase import Client
from typing import Dict, Any

from app.services.couple_service import CoupleService
from app.services.mood_service import MoodService
from app.services.memory_service import MemoryService
from app.repositories.couple_repo import CoupleRepository, InviteCodeRepository
from app.repositories.user_repo import UserRepository
from app.repositories.mood_repo import MoodRepository, MoodAlertRepository
from app.repositories.memory_repo import MemoryRepository, MemoryImageRepository
from app.schemas.couple import CoupleResponse

class FeedService:
    def __init__(self, db: Client):
        self.db = db
        self.couple_service = CoupleService(
            db, CoupleRepository(db), InviteCodeRepository(db), UserRepository(db)
        )
        self.mood_service = MoodService(db)
        self.memory_service = MemoryService(
            db, MemoryRepository(db), MemoryImageRepository(db)
        )

    def get_home_feed(self, user_id: str) -> Dict[str, Any]:
        try:
            couple, p1_info, p2_info, my_role = self.couple_service.get_couple_for(user_id)
        except Exception:
            return {
                "has_couple": False,
                "couple": None,
                "partner_latest_mood": None,
                "active_alert": None,
                "upcoming_memories": []
            }

        couple_resp = CoupleResponse.build(couple, p1_info, p2_info, my_role)
        
        partner_id = p1_info.id if my_role == "partner2" else (p2_info.id if p2_info else None)
        
        latest_mood, active_alert = None, None
        if partner_id:
            latest_mood, active_alert = self.mood_service.get_partner_latest_mood_and_alert(partner_id)
            
        # Lấy tối đa 3 kỷ niệm sắp tới (năm nay hoặc chưa set năm)
        memories, _ = self.memory_service.list_memories(couple.id)
        # Sắp xếp hoặc lấy 3 cái (Vì list_memories đang sort giảm dần theo ngày, ta lấy 3 cái đầu)
        upcoming = memories[:3]
        
        return {
            "has_couple": True,
            "couple": couple_resp.model_dump(),
            "partner_latest_mood": latest_mood.to_dict() if latest_mood else None,
            "active_alert": active_alert.to_dict() if active_alert else None,
            "upcoming_memories": [m.to_dict() for m in upcoming]
        }
