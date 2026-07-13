from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from app.models.couple import Couple, CoupleMember, InviteCode


class CreateInviteResponse(BaseModel):
    code: str
    expires_at: str
    status: str
    is_pending: bool = True

    @classmethod
    def from_model(cls, ic: InviteCode) -> "CreateInviteResponse":
        return cls(
            code=ic.code,
            expires_at=ic.expires_at,
            status=ic.status,
            is_pending=ic.status == "pending",
        )


class GetInviteResponse(BaseModel):
    code: str
    expires_at: str
    status: str
    is_pending: bool

    @classmethod
    def from_model(cls, ic: InviteCode) -> "GetInviteResponse":
        return cls(
            code=ic.code,
            expires_at=ic.expires_at,
            status=ic.status,
            is_pending=ic.status == "pending",
        )


class AcceptInviteRequest(BaseModel):
    code: str = Field(min_length=4, max_length=64)


class MemberInfo(BaseModel):
    id: str
    full_name: str
    avatar_url: str | None = None


class CoupleResponse(BaseModel):
    id: str
    partner1: MemberInfo | None = None
    partner2: MemberInfo | None = None
    anniversary: str | None = None
    created_at: str
    status: str
    my_role: str

    @classmethod
    def _build_member_info(
        cls, raw: Any
    ) -> MemberInfo | None:
        if raw is None:
            return None
        if isinstance(raw, MemberInfo):
            return raw
        return MemberInfo(
            id=raw["id"],
            full_name=raw.get("full_name", ""),
            avatar_url=raw.get("avatar_url"),
        )

    @classmethod
    def build(
        cls,
        couple: Couple,
        members: list[CoupleMember],
        member_user_lookup: dict[str, Any],
        my_role: str,
    ) -> "CoupleResponse":
        partner1_info: MemberInfo | None = None
        partner2_info: MemberInfo | None = None
        for member in members:
            info = cls._build_member_info(
                member_user_lookup.get(member.user_id)
            )
            if member.role == "partner1":
                partner1_info = info
            elif member.role == "partner2":
                partner2_info = info
        return cls(
            id=couple.id,
            partner1=partner1_info,
            partner2=partner2_info,
            anniversary=couple.anniversary,
            created_at=couple.created_at,
            status=couple.status,
            my_role=my_role,
        )


class UpdateAnniversaryRequest(BaseModel):
    anniversary: str | None = Field(default=None, max_length=32)