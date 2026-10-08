from __future__ import annotations

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
    ) -> list[Memory]:
        query = (
            self.db.table(self.table)
            .select("*")
            .eq("couple_id", couple_id)
            .order("memory_date", desc=True)
        )
        if category:
            query = query.eq("category", category)
        if year is not None:
            query = query.gte("memory_date", f"{year}-01-01").lt(
                "memory_date", f"{year + 1}-01-01"
            )
        resp = query.execute()
        return [self.model_cls.from_dict(r) for r in resp.data]


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
        return [self.model_cls.from_dict(r) for r in resp.data]

    def delete_by_memory(self, memory_id: str) -> int:
        resp = (
            self.db.table(self.table)
            .delete()
            .eq("memory_id", memory_id)
            .execute()
        )
        return len(resp.data) if resp.data else 0