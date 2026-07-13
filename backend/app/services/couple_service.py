from __future__ import annotations

from datetime import datetime, timezone

from app.config import settings
from app.core.constants import CoupleStatus
from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models.couple import Couple, CoupleMember, InviteCode
from app.repositories.couple_repo import (
    CoupleMemberRepository,
    CoupleRepository,
    InviteCodeRepository,
)
from app.repositories.user_repo import UserRepository
from app.schemas.couple import MemberInfo
from app.storage.base import Storage
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
        storage: Storage,
        couple_repo: CoupleRepository,
        member_repo: CoupleMemberRepository,
        invite_repo: InviteCodeRepository,
        user_repo: UserRepository,
    ) -> None:
        self.storage = storage
        self.couple_repo = couple_repo
        self.member_repo = member_repo
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
                ic.id, status="cancelled", updated_at=now_iso
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
        self._create_members(invite.user_id, user_id, couple_id, now_iso)
        self.invite_repo.update(
            invite.id,
            status="accepted",
            used_by=user_id,
            updated_at=now_iso,
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
        if self.member_repo.find_by_user(user_id):
            raise ConflictError("Bạn đã thuộc một couple")
        if self.member_repo.find_by_user(invite.user_id):
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

    def _create_members(
        self,
        partner1_id: str,
        partner2_id: str,
        couple_id: str,
        now_iso: str,
    ) -> None:
        self.member_repo.create(
            id=generate_uuid(),
            couple_id=couple_id,
            user_id=partner1_id,
            role="partner1",
            joined_at=now_iso,
        )
        self.member_repo.create(
            id=generate_uuid(),
            couple_id=couple_id,
            user_id=partner2_id,
            role="partner2",
            joined_at=now_iso,
        )

    def get_couple_for(
        self, user_id: str
    ) -> tuple[Couple, list[CoupleMember], str]:
        member = self.member_repo.find_by_user(user_id)
        if not member:
            raise NotFoundError("Bạn chưa thuộc couple nào")
        couple = self.couple_repo.get(member.couple_id)
        if not couple:
            raise NotFoundError("Couple không tồn tại")
        members = self.member_repo.find_by_couple(couple.id)
        return couple, members, member.role

    def get_couple_members_info(
        self, members: list[CoupleMember]
    ) -> list[MemberInfo]:
        infos: list[MemberInfo] = []
        for member in members:
            user = self.user_repo.get(member.user_id)
            if user is None:
                continue
            infos.append(
                MemberInfo(
                    id=user.id,
                    full_name=user.full_name,
                    avatar_url=user.avatar_url,
                )
            )
        return infos

    def update_anniversary(
        self, user_id: str, date_str: str | None
    ) -> Couple:
        member = self.member_repo.find_by_user(user_id)
        if not member:
            raise NotFoundError("Bạn chưa thuộc couple nào")
        couple = self.couple_repo.get(member.couple_id)
        if not couple:
            raise NotFoundError("Couple không tồn tại")
        now_iso = to_iso(now_utc())
        return self.couple_repo.update(
            couple.id, anniversary=date_str, updated_at=now_iso
        )