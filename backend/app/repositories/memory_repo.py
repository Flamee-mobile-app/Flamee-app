"""Repository cho Memory và Memory Image."""
from __future__ import annotations

from typing import List, Optional

from app.core.constants import MEMORIES, MEMORY_IMAGES
from app.models.memory import Memory, MemoryImage
from app.repositories.base import BaseRepository


class MemoryRepository(BaseRepository[Memory]):
    table = MEMORIES
    model_cls = Memory

    def find_by_couple(
        self,
        couple_id: str,
        *,
        category: str | None = None,
        year: int | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Memory]:
        query = (
            self.db.table(self.table)
            .select("*")
            .eq("couple_id", couple_id)
            .order("memory_date", desc=True)
            .order("created_at", desc=True)
            .range(offset, offset + max(0, limit - 1))
        )
        if category:
            query = query.eq("category", category)
        if year is not None:
            query = (
                query
                .gte("memory_date", f"{year}-01-01")
                .lt("memory_date", f"{year + 1}-01-01")
            )
        resp = query.execute()
        return [self.model_cls.from_dict(r) for r in (resp.data or [])]

    def count_by_couple(
        self,
        couple_id: str,
        *,
        category: str | None = None,
        year: int | None = None,
    ) -> int:
        """M-03: đếm chính xác thay vì len(items)."""
        query = (
            self.db.table(self.table)
            .select("id", count="exact")
            .eq("couple_id", couple_id)
        )
        if category:
            query = query.eq("category", category)
        if year is not None:
            query = (
                query
                .gte("memory_date", f"{year}-01-01")
                .lt("memory_date", f"{year + 1}-01-01")
            )
        resp = query.execute()
        return int(getattr(resp, "count", 0) or 0)


class MemoryImageRepository(BaseRepository[MemoryImage]):
    table = MEMORY_IMAGES
    model_cls = MemoryImage

    def find_by_memory(self, memory_id: str) -> list[MemoryImage]:
        resp = (
            self.db.table(self.table)
            .select("*")
            .eq("memory_id", memory_id)
            .order("created_at")
            .execute()
        )
        return [self.model_cls.from_dict(r) for r in (resp.data or [])]

    def find_by_memories(self, memory_ids: List[str]) -> list[MemoryImage]:
        """Batch load ảnh cho nhiều memory (tránh N+1)."""
        if not memory_ids:
            return []
        resp = (
            self.db.table(self.table)
            .select("*")
            .in_("memory_id", memory_ids)
            .order("created_at")
            .execute()
        )
        return [self.model_cls.from_dict(r) for r in (resp.data or [])]

    def delete_by_memory(self, memory_id: str) -> int:
        resp = (
            self.db.table(self.table)
            .delete()
            .eq("memory_id", memory_id)
            .execute()
        )
        return len(resp.data) if resp.data else 0
