from __future__ import annotations

from app.core.constants import COUPLES, COUPLE_MEMBERS, INVITE_CODES
from app.models.couple import Couple, CoupleMember, InviteCode
from app.repositories.base import BaseRepository


class CoupleRepository(BaseRepository[Couple]):
    table = COUPLES
    model_cls = Couple


class CoupleMemberRepository(BaseRepository[CoupleMember]):
    table = COUPLE_MEMBERS
    model_cls = CoupleMember

    def find_by_couple(self, couple_id: str) -> list[CoupleMember]:
        return self.find({"couple_id": couple_id})

    def find_by_user(self, user_id: str) -> CoupleMember | None:
        return self.find_one({"user_id": user_id})


class InviteCodeRepository(BaseRepository[InviteCode]):
    table = INVITE_CODES
    model_cls = InviteCode

    def get_by_code(self, code_str: str) -> InviteCode | None:
        return self.find_one({"code": code_str})

    def find_active_by_user(self, user_id: str) -> InviteCode | None:
        """Return the most recent PENDING invite code for `user_id`, if any."""
        candidates = [
            ic for ic in self.find({"user_id": user_id, "status": "pending"})
        ]
        if not candidates:
            return None
        candidates.sort(key=lambda ic: ic.created_at, reverse=True)
        return candidates[0]

    def find_latest_by_user(self, user_id: str) -> InviteCode | None:
        """Return the most recently created invite code for `user_id`, if any."""
        candidates = list(self.find({"user_id": user_id}))
        if not candidates:
            return None
        candidates.sort(key=lambda ic: ic.created_at, reverse=True)
        return candidates[0]