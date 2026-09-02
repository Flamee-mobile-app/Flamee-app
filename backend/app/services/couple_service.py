from __future__ import annotations

from datetime import datetime, timezone

from supabase import Client

from app.config import settings
from app.core.constants import CoupleStatus
from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models.couple import Couple, InviteCode
from app.repositories.couple_repo import (
    CoupleRepository,
    InviteCodeRepository,
)
from app.repositories.user_repo import UserRepository
from app.schemas.couple import MemberInfo
from app.utils.ids import generate_invite_code, generate_uuid
from app.utils.time import add_hours, now_utc, to_iso


def _is_expired(ic: InviteCode, now: datetime | None = None) -> bool:
    now = now or now_utc()
    try:
        expires_dt = datetime.fromisoformat(ic.expires_at)
    except ValueError:
        return True
    if expires_dt.tzinfo is None:
        expires_dt = expires_dt.replace(tzinfo=timezone.utc)
    return expires_dt <= now


class CoupleService:
    """Couple creation, invite-code flow, and lookup."""

    def __init__(
        self,
        db: Client,
        couple_repo: CoupleRepository,
        invite_repo: InviteCodeRepository,
        user_repo: UserRepository,
    ) -> None:
        self.db = db
        self.couple_repo = couple_repo
        self.invite_repo = invite_repo
        self.user_repo = user_repo

    def create_invite(self, user_id: str) -> InviteCode:
        """Deactivate prior PENDING codes for this user, then create a new one."""
        prior = self.invite_repo.find(
            {"user_id": user_id, "status": "pending"}
        )
        now_iso = to_iso(now_utc())
        for ic in prior:
            self.invite_repo.update(
                ic.id, status="cancelled"
            )
        now = now_utc()
        code = self._pick_unique_code()
        expires_at = to_iso(add_hours(now, settings.invite_code_ttl_hours))
        return self.invite_repo.create(
            id=generate_uuid(),
            code=code,
            user_id=user_id,
            status="pending",
            created_at=to_iso(now),
            expires_at=expires_at,
        )

    def _pick_unique_code(self) -> str:
        for _ in range(5):
            code = generate_invite_code()
            if self.invite_repo.get_by_code(code) is None:
                return code
        raise ConflictError("Could not generate a unique invite code")

    def get_my_invite(self, user_id: str) -> InviteCode | None:
        """Return the user's most recent invite code (any status)."""
        return self.invite_repo.find_latest_by_user(user_id)

    def accept_invite(self, user_id: str, code_str: str) -> Couple:
        invite = self._validate_invite(user_id, code_str)
        now_iso = to_iso(now_utc())
        couple_id = self._create_couple(invite.user_id, user_id, now_iso)
        self.invite_repo.update(
            invite.id,
            status="accepted",
            used_by=user_id,
        )
        self.user_repo.update(
            invite.user_id, couple_id=couple_id, updated_at=now_iso
        )
        self.user_repo.update(
            user_id, couple_id=couple_id, updated_at=now_iso
        )
        couple = self.couple_repo.get(couple_id)
        if couple is None:
            raise ConflictError("Couple creation failed")
        return couple

    def _validate_invite(
        self, user_id: str, code_str: str
    ) -> InviteCode:
        invite = self.invite_repo.get_by_code(code_str)
        if not invite or invite.status != "pending" or _is_expired(invite):
            raise ConflictError(
                "Invite code không hợp lệ hoặc đã hết hạn"
            )
        if invite.user_id == user_id:
            raise ValidationError(
                "Bạn không thể tự accept invite của mình"
            )
        user = self.user_repo.get(user_id)
        if user and user.couple_id:
            raise ConflictError("Bạn đã thuộc một couple")
        inviter = self.user_repo.get(invite.user_id)
        if inviter and inviter.couple_id:
            raise ConflictError("Người tạo invite đã thuộc một couple")
        return invite

    def _create_couple(
        self, partner1_id: str, partner2_id: str, now_iso: str
    ) -> str:
        couple_id = generate_uuid()
        self.couple_repo.create(
            id=couple_id,
            partner1_id=partner1_id,
            partner2_id=partner2_id,
            anniversary=None,
            status=CoupleStatus.ACTIVE.value,
            created_at=now_iso,
            updated_at=now_iso,
        )
        return couple_id

    def get_couple_for(
        self, user_id: str
    ) -> tuple[Couple, MemberInfo | None, MemberInfo | None, str]:
        user = self.user_repo.get(user_id)
        if not user or not user.couple_id:
            raise NotFoundError("Bạn chưa thuộc couple nào")
        couple = self.couple_repo.get(user.couple_id)
        if not couple:
            raise NotFoundError("Couple không tồn tại")
        
        partner1_info = None
        partner2_info = None
        my_role = ""

        if couple.partner1_id:
            p1 = self.user_repo.get(couple.partner1_id)
            if p1:
                partner1_info = MemberInfo(id=p1.id, full_name=p1.full_name, avatar_url=p1.avatar_url)
            if couple.partner1_id == user_id:
                my_role = "partner1"

        if couple.partner2_id:
            p2 = self.user_repo.get(couple.partner2_id)
            if p2:
                partner2_info = MemberInfo(id=p2.id, full_name=p2.full_name, avatar_url=p2.avatar_url)
            if couple.partner2_id == user_id:
                my_role = "partner2"
                
        return couple, partner1_info, partner2_info, my_role

    def update_anniversary(
        self, user_id: str, date_str: str | None
    ) -> Couple:
        user = self.user_repo.get(user_id)
        if not user or not user.couple_id:
            raise NotFoundError("Bạn chưa thuộc couple nào")
        couple = self.couple_repo.get(user.couple_id)
        if not couple:
            raise NotFoundError("Couple không tồn tại")
        now_iso = to_iso(now_utc())
        return self.couple_repo.update(
            couple.id, anniversary=date_str, updated_at=now_iso
        )