"""Repository cho Mood và Mood Alerts."""
from __future__ import annotations

from typing import List, Optional

from supabase import Client

from app.models.mood import Mood, MoodAlert

# share_levels KHÔNG được đưa vào response partner view
SHAREABLE_LEVELS = ("all", "mood_only")


class MoodRepository:
    def __init__(self, db: Client) -> None:
        self.db = db

    def create_mood(self, mood_data: dict) -> Mood:
        res = self.db.table("moods").insert(mood_data).execute()
        return Mood(**res.data[0])

    def get_recent_moods(self, user_id: str, limit: int = 3) -> List[Mood]:
        res = (
            self.db.table("moods")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return [Mood(**m) for m in res.data]

    def get_shareable_moods_by_date(
        self, user_id: str, date_str: str
    ) -> List[Mood]:
        """Lấy mood ngày `date_str` NHƯNG loại bỏ private (chỉ dùng cho digest)."""
        res = (
            self.db.table("moods")
            .select("*")
            .eq("user_id", user_id)
            .eq("is_private", False)
            .ilike("created_at", f"{date_str}%")
            .order("created_at", desc=True)
            .execute()
        )
        return [Mood(**m) for m in res.data]

    def get_moods_by_date(self, user_id: str, date_str: str) -> List[Mood]:
        res = (
            self.db.table("moods")
            .select("*")
            .eq("user_id", user_id)
            .ilike("created_at", f"{date_str}%")
            .order("created_at", desc=True)
            .execute()
        )
        return [Mood(**m) for m in res.data]

    def get_latest_mood(self, user_id: str) -> Optional[Mood]:
        res = (
            self.db.table("moods")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        return Mood(**res.data[0]) if res.data else None

    def get_latest_shareable_mood(self, user_id: str) -> Optional[Mood]:
        """Mood mới nhất mà partner được phép xem (bỏ private).

        Khi share_level='mood_only' thì che note ở tầng schema, không trả về.
        """
        res = (
            self.db.table("moods")
            .select("*")
            .eq("user_id", user_id)
            .neq("share_level", "private")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if not res.data:
            return None
        mood = Mood(**res.data[0])
        if mood.share_level == "mood_only":
            mood.note = None
            mood.reasons = None
        return mood

    def delete_mood(self, mood_id: str, user_id: str) -> bool:
        """Chỉ xóa nếu mood thuộc về user — bảo vệ quyền sở hữu."""
        res = (
            self.db.table("moods")
            .delete()
            .eq("id", mood_id)
            .eq("user_id", user_id)
            .execute()
        )
        return bool(res.data)


class MoodAlertRepository:
    def __init__(self, db: Client) -> None:
        self.db = db

    def create_alert(self, alert_data: dict) -> MoodAlert:
        res = self.db.table("mood_alerts").insert(alert_data).execute()
        return MoodAlert(**res.data[0])

    def get_active_alert_for_partner(self, partner_id: str) -> Optional[MoodAlert]:
        """Alert partner chưa đọc, không bao gồm daily digest."""
        res = (
            self.db.table("mood_alerts")
            .select("*")
            .eq("user_id", partner_id)
            .eq("is_read", False)
            .neq("alert_type", "daily_digest")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        return MoodAlert(**res.data[0]) if res.data else None

    def get_daily_digest_for_date(
        self, user_id: str, date_str: str
    ) -> Optional[MoodAlert]:
        res = (
            self.db.table("mood_alerts")
            .select("*")
            .eq("user_id", user_id)
            .eq("alert_type", "daily_digest")
            .ilike("created_at", f"{date_str}%")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        return MoodAlert(**res.data[0]) if res.data else None

    def get_latest_alert_for_user(self, user_id: str) -> Optional[MoodAlert]:
        res = (
            self.db.table("mood_alerts")
            .select("*")
            .eq("user_id", user_id)
            .neq("alert_type", "daily_digest")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        return MoodAlert(**res.data[0]) if res.data else None

    def mark_as_read(self, alert_id: str, user_id: str) -> bool:
        """Đánh dấu đã đọc nếu alert thuộc về user."""
        res = (
            self.db.table("mood_alerts")
            .update({"is_read": True})
            .eq("id", alert_id)
            .eq("user_id", user_id)
            .execute()
        )
        return bool(res.data)

    def update_alert(self, alert_id: str, data: dict) -> None:
        self.db.table("mood_alerts").update(data).eq("id", alert_id).execute()