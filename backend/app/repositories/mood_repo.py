from supabase import Client
from typing import List, Optional
from app.models.mood import Mood, MoodAlert

class MoodRepository:
    def __init__(self, db: Client):
        self.db = db

    def create_mood(self, mood_data: dict) -> Mood:
        res = self.db.table("moods").insert(mood_data).execute()
        return Mood(**res.data[0])
        
    def get_recent_moods(self, user_id: str, limit: int = 3) -> List[Mood]:
        res = self.db.table("moods")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()
        return [Mood(**m) for m in res.data]
        
    def get_latest_mood(self, user_id: str) -> Optional[Mood]:
        res = self.db.table("moods")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()
        if res.data:
            return Mood(**res.data[0])
        return None

class MoodAlertRepository:
    def __init__(self, db: Client):
        self.db = db
        
    def create_alert(self, alert_data: dict) -> MoodAlert:
        res = self.db.table("mood_alerts").insert(alert_data).execute()
        return MoodAlert(**res.data[0])
        
    def get_active_alert_for_partner(self, partner_id: str) -> Optional[MoodAlert]:
        # Tạm coi người nhận cảnh báo là người trong cùng couple nhưng khác user_id
        # Lấy alert chưa đọc mới nhất
        res = self.db.table("mood_alerts")\
            .select("*")\
            .neq("user_id", partner_id)\
            .eq("is_read", False)\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()
        if res.data:
            return MoodAlert(**res.data[0])
        return None
        
    def mark_as_read(self, alert_id: str):
        self.db.table("mood_alerts").update({"is_read": True}).eq("id", alert_id).execute()
