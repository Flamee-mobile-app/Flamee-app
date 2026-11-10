"""Repository cho Smart Nudge và Tiny Moment."""
from __future__ import annotations

from typing import Any, Optional

from app.models.smart_nudge import SmartNudge, TinyMoment
from app.repositories.base import BaseRepository
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError


class SmartNudgeRepository(BaseRepository[SmartNudge]):
    table = "smart_nudges"
    model_cls = SmartNudge

    def create_guarded(self, fields: dict) -> SmartNudge | None:
        payload = self.model_cls(**fields).to_dict()
        result = self.db.rpc('create_smart_nudge_guarded', {'p_payload': payload}).execute().data
        if not isinstance(result, dict):
            raise RuntimeError('Invalid nudge generation acknowledgement')
        if result.get('outcome') == 'suppressed':
            return None
        if result.get('outcome') != 'created':
            raise RuntimeError('Invalid nudge generation outcome')
        return self.model_cls.from_dict(result['nudge'])

    def mutate(self, nudge_id, user_id, action, version=None, rating=None, feedback=None):
        result = self.db.rpc('mutate_smart_nudge', {
            'p_nudge_id': nudge_id, 'p_user_id': user_id, 'p_action': action,
            'p_version': version, 'p_rating': rating, 'p_feedback': feedback,
        }).execute().data
        outcome = result.get('outcome') if isinstance(result, dict) else None
        if outcome == 'not_found':
            raise NotFoundError('Nudge not found')
        if outcome in ('forbidden', 'snooze_limit'):
            raise ForbiddenError('Nudge is not available for this action')
        if outcome != 'ok':
            raise ConflictError('Nudge changed or expired; reload before acting', code='nudge_state_conflict')
        return self.model_cls.from_dict(result['nudge'])

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
