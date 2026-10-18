"""Repository cho Smart Nudge và Tiny Moment."""
from __future__ import annotations

from typing import Any, Optional

from app.models.smart_nudge import SmartNudge, TinyMoment
from app.repositories.base import BaseRepository


class SmartNudgeRepository(BaseRepository[SmartNudge]):
    table = "smart_nudges"
    model_cls = SmartNudge

    def get_active_nudge(
        self, couple_id: str, receiver_id: str
    ) -> SmartNudge | None:
        """Back-compat: 1 nudge active gần nhất."""
        rows = (
            self.db.table(self.table)
            .select("*")
            .eq("couple_id", couple_id)
            .eq("receiver_id", receiver_id)
            .eq("status", "new")
            .order("version", desc=True)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        data = getattr(rows, "data", None) or []
        return self.model_cls.from_dict(data[0]) if data else None

    def get_active_nudges(
        self, couple_id: str, receiver_id: str
    ) -> list[SmartNudge]:
        """Plan mục 4: tất cả nudge hợp lệ, sắp xếp theo version desc."""
        rows = (
            self.db.table(self.table)
            .select("*")
            .eq("couple_id", couple_id)
            .eq("receiver_id", receiver_id)
            .eq("status", "new")
            .order("version", desc=True)
            .order("created_at", desc=True)
            .execute()
        )
        data = getattr(rows, "data", None) or []
        return [self.model_cls.from_dict(r) for r in data]

    def count_nudges_today(
        self, couple_id: str, receiver_id: str, date_prefix: str
    ) -> int:
        rows = (
            self.db.table(self.table)
            .select("id", count="exact")
            .eq("couple_id", couple_id)
            .eq("receiver_id", receiver_id)
            .like("created_at", f"{date_prefix}%")
            .execute()
        )
        return int(getattr(rows, "count", 0) or 0)

    def get_latest_nudge(
        self, couple_id: str, receiver_id: str
    ) -> SmartNudge | None:
        rows = (
            self.db.table(self.table)
            .select("*")
            .eq("couple_id", couple_id)
            .eq("receiver_id", receiver_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        data = getattr(rows, "data", None) or []
        return self.model_cls.from_dict(data[0]) if data else None

    def update(self, id: str, **patch: Any) -> SmartNudge:
        """Bump version tự động nếu patch là status/state change."""
        if "version" not in patch:
            current = self.get(id)
            if current is not None:
                patch["version"] = current.version + 1
        return super().update(id, **patch)


class TinyMomentRepository(BaseRepository[TinyMoment]):
    table = "tiny_moments"
    model_cls = TinyMoment

    def get_recent(
        self, couple_id: str, limit: int = 20
    ) -> list[TinyMoment]:
        rows = (
            self.db.table(self.table)
            .select("*")
            .eq("couple_id", couple_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        data = getattr(rows, "data", []) or []
        return [self.model_cls.from_dict(r) for r in data]
