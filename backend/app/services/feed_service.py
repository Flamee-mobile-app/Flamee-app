"""Home feed: trạng thái partner + upcoming memories + alerts."""
from __future__ import annotations

from dataclasses import asdict
from typing import Any, Optional

from fastapi import BackgroundTasks
from supabase import Client

from app.core.exceptions import NotFoundError
from app.repositories.couple_repo import CoupleRepository, InviteCodeRepository
from app.repositories.memory_repo import MemoryImageRepository, MemoryRepository
from app.repositories.mood_repo import MoodAlertRepository, MoodRepository
from app.repositories.user_repo import UserRepository
from app.schemas.couple import CoupleResponse
from app.services.couple_service import CoupleService
from app.services.memory_service import MemoryService
from app.services.mood_service import MoodService

DEFAULT_LIMIT_UPCOMING = 3


class FeedService:
    def __init__(self, db: Client) -> None:
        self.db = db
        self.couple_service = CoupleService(
            db,
            CoupleRepository(db),
            InviteCodeRepository(db),
            UserRepository(db),
        )
        self.mood_service = MoodService(db)
        self.memory_service = MemoryService(
            db, MemoryRepository(db), MemoryImageRepository(db)
        )
        self.mood_repo = MoodRepository(db)
        self.alert_repo = MoodAlertRepository(db)

    def get_home_feed(
        self,
        user_id: str,
        background_tasks: BackgroundTasks = None,
    ) -> dict[str, Any]:
        try:
            couple, p1_info, p2_info, role = self.couple_service.get_couple_for(
                user_id
            )
        except NotFoundError:
            return _empty_feed()

        couple_resp = CoupleResponse.build(
            couple, p1_info, p2_info, role
        )
        partner_id = (
            p1_info.id
            if role == "partner2"
            else (p2_info.id if p2_info else None)
        )

        latest_mood, active_alert = None, None
        if partner_id:
            latest_mood, active_alert = (
                self.mood_service.get_partner_latest_mood_and_alert(partner_id, couple.id)
            )
            if background_tasks is not None:
                # Daily digest chạy nền
                self.mood_service.get_or_generate_daily_digest(
                    user_id=user_id,
                    partner_id=partner_id,
                    couple_id=couple.id,
                    background_tasks=background_tasks,
                )

        # Chỉ lấy tối đa N memory từ DB (không load hết)
        memories, _, _ = self.memory_service.list_memories(
            couple.id, limit=DEFAULT_LIMIT_UPCOMING, offset=0
        )

        return {
            "has_couple": True,
            "couple": couple_resp.model_dump(),
            "partner_latest_mood": asdict(latest_mood) if latest_mood else None,
            "active_alert": asdict(active_alert) if active_alert else None,
            "upcoming_memories": [m.model_dump() for m in memories],
        }


def _empty_feed() -> dict[str, Any]:
    return {
        "has_couple": False,
        "couple": None,
        "partner_latest_mood": None,
        "active_alert": None,
        "upcoming_memories": [],
    }


__all__ = ["FeedService"]
