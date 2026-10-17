from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, field_validator

from app.models.couple import Couple, InviteCode


class CreateInviteResponse(BaseModel):
    code: str
    expires_at: str
    status: str
    is_pending: bool = True
    created_at: str | None = None

    @classmethod
    def from_model(cls, ic: InviteCode) -> "CreateInviteResponse":
        return cls(
            code=ic.code,
            expires_at=ic.expires_at,
            status=ic.status,
            is_pending=ic.status == "pending",
            created_at=getattr(ic, "created_at", None),
        )


class GetInviteResponse(BaseModel):
    code: str
    expires_at: str
    status: str
    is_pending: bool
    created_at: str | None = None

    @classmethod
    def from_model(cls, ic: InviteCode) -> "GetInviteResponse":
        return cls(
            code=ic.code,
            expires_at=ic.expires_at,
            status=ic.status,
            is_pending=ic.status == "pending",
            created_at=getattr(ic, "created_at", None),
        )


class AcceptInviteRequest(BaseModel):
    code: str = Field(min_length=6, max_length=6, pattern=r"^[A-Z0-9]{6}$")

    @field_validator("code", mode="before")
    @classmethod
    def normalize_code(cls, value: object) -> object:
        return value.strip().upper() if isinstance(value, str) else value


class MemberInfo(BaseModel):
    id: str
    full_name: str
    avatar_url: str | None = None


class InvitePreviewResponse(BaseModel):
    code: str
    expires_at: str
    inviter: MemberInfo


class CoupleResponse(BaseModel):
    id: str
    partner1: MemberInfo | None = None
    partner2: MemberInfo | None = None
    anniversary: str | None = None
    created_at: str
    status: str
    my_role: str
    days_together: int | None = None

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
        partner1_info: MemberInfo | None,
        partner2_info: MemberInfo | None,
        my_role: str,
    ) -> "CoupleResponse":
        return cls(
            id=couple.id,
            partner1=partner1_info,
            partner2=partner2_info,
            anniversary=couple.anniversary,
            created_at=couple.created_at,
            status=couple.status,
            my_role=my_role,
            days_together=cls._calculate_days(couple.anniversary),
        )
        
    @staticmethod
    def _calculate_days(anniversary: str | None) -> int | None:
        if not anniversary:
            return None
        try:
            from datetime import datetime
            ann_date = datetime.strptime(anniversary[:10], "%Y-%m-%d")
            delta = datetime.now() - ann_date
            return max(0, delta.days)
        except Exception:
            return None


class UpdateAnniversaryRequest(BaseModel):
    anniversary: str | None = Field(default=None, max_length=32)
