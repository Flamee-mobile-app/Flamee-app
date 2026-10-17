from __future__ import annotations

from datetime import datetime, timezone

from supabase import Client

from app.config import settings
from app.core.constants import CoupleStatus
from app.core.exceptions import ConflictError, InviteError, NotFoundError, ValidationError
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
        user = self.user_repo.get(user_id)
        if user and user.couple_id:
            raise InviteError("already_paired", "Bạn đã được ghép đôi")
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
        invite = self.invite_repo.find_latest_by_user(user_id)
        if invite and invite.status == "pending" and _is_expired(invite):
            invite = self.invite_repo.update(invite.id, status="expired")
        return invite

    def validate_invite(self, user_id: str, code_str: str) -> tuple[InviteCode, MemberInfo]:
        invite = self._validate_invite(user_id, code_str)
        inviter = self.user_repo.get(invite.user_id)
        if inviter is None:
            raise InviteError("invite_not_found", "Mã mời không tồn tại")
        return invite, MemberInfo(
            id=inviter.id,
            full_name=inviter.full_name,
            avatar_url=inviter.avatar_url,
        )

    def revoke_invite(self, user_id: str) -> InviteCode:
        invite = self.invite_repo.find_active_by_user(user_id)
        if invite is None:
            raise InviteError("invite_not_found", "Không có mã mời đang hoạt động")
        if _is_expired(invite):
            self.invite_repo.update(invite.id, status="expired")
            raise InviteError("invite_expired", "Mã mời đã hết hạn")
        return self.invite_repo.update(invite.id, status="cancelled")

    def accept_invite(self, user_id: str, code_str: str) -> Couple:
        now_iso = to_iso(now_utc())
        couple_id = generate_uuid()
        result = self.couple_repo.accept_invite_atomic(
            invitee_id=user_id,
            code=code_str.strip().upper(),
            couple_id=couple_id,
            now_iso=now_iso,
        )
        outcome = result.get("outcome")
        errors = {
            "invite_not_found": "Mã mời không tồn tại",
            "invite_cancelled": "Mã mời đã bị thu hồi",
            "invite_used": "Mã mời đã được sử dụng",
            "invite_expired": "Mã mời đã hết hạn",
            "already_paired": "Bạn đã được ghép đôi",
            "inviter_already_paired": "Người tạo mã đã được ghép đôi",
        }
        if outcome == "self_invite":
            raise ValidationError("Bạn không thể dùng mã mời của mình", code=outcome)
        if outcome != "accepted":
            raise InviteError(outcome or "invite_not_found", errors.get(outcome, "Không thể ghép đôi"))
        couple_id = result.get("couple_id", couple_id)
        couple = self.couple_repo.get(couple_id)
        if couple is None:
            raise ConflictError("Couple creation failed")
        return couple

    def _validate_invite(
        self, user_id: str, code_str: str
    ) -> InviteCode:
        invite = self.invite_repo.get_by_code(code_str.strip().upper())
        if not invite:
            raise InviteError("invite_not_found", "Mã mời không tồn tại")
        if invite.status == "cancelled":
            raise InviteError("invite_cancelled", "Mã mời đã bị thu hồi")
        if invite.status == "accepted":
            raise InviteError("invite_used", "Mã mời đã được sử dụng")
        if invite.status == "expired" or _is_expired(invite):
            if invite.status != "expired":
                self.invite_repo.update(invite.id, status="expired")
            raise InviteError("invite_expired", "Mã mời đã hết hạn")
        if invite.user_id == user_id:
            raise ValidationError("Bạn không thể dùng mã mời của mình", code="self_invite")
        user = self.user_repo.get(user_id)
        if user and user.couple_id:
            raise InviteError("already_paired", "Bạn đã được ghép đôi")
        inviter = self.user_repo.get(invite.user_id)
        if inviter and inviter.couple_id:
            raise InviteError("inviter_already_paired", "Người tạo mã đã được ghép đôi")
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

    def break_up(self, user_id: str) -> bool:
        user = self.user_repo.get(user_id)
        if not user or not user.couple_id:
            raise NotFoundError("Bạn chưa thuộc couple nào")
        couple = self.couple_repo.get(user.couple_id)
        if not couple:
            raise NotFoundError("Couple không tồn tại")
            
        # Reset couple_id của 2 người về None
        now_iso = to_iso(now_utc())
        if couple.partner1_id:
            self.user_repo.update(couple.partner1_id, couple_id=None, updated_at=now_iso)
        if couple.partner2_id:
            self.user_repo.update(couple.partner2_id, couple_id=None, updated_at=now_iso)
            
        # Xóa Couple (ON DELETE CASCADE sẽ xóa luôn Kỷ niệm, Cảm xúc, Tin nhắn)
        self.couple_repo.delete(couple.id)
        return True
