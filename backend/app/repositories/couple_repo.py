from __future__ import annotations

from app.core.constants import COUPLES, INVITE_CODES
from app.models.couple import Couple, InviteCode
from app.repositories.base import BaseRepository


class CoupleRepository(BaseRepository[Couple]):
    table = COUPLES
    model_cls = Couple



class InviteCodeRepository(BaseRepository[InviteCode]):
    table = INVITE_CODES
    model_cls = InviteCode

    def get_by_code(self, code_str: str) -> InviteCode | None:
        return self.find_one({"code": code_str})

    def find_active_by_user(self, user_id: str) -> InviteCode | None:
        """Return the most recent PENDING invite code for `user_id`, if any."""
        resp = (
            self.db.table(self.table)
            .select("*")
            .eq("user_id", user_id)
            .eq("status", "pending")
            .order("created_at", desc=True)
            .limit(1)
            .maybe_single()
            .execute()
        )
        return self.model_cls.from_dict(resp.data) if resp.data else None

    def find_latest_by_user(self, user_id: str) -> InviteCode | None:
        """Return the most recently created invite code for `user_id`, if any."""
        resp = (
            self.db.table(self.table)
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .maybe_single()
            .execute()
        )
        return self.model_cls.from_dict(resp.data) if resp.data else None