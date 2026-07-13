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
        where: dict = {"couple_id": couple_id}
        if category:
            where["category"] = category
        if year is not None:
            where["memory_date__gte"] = f"{year}-01-01"
            where["memory_date__lt"] = f"{year + 1}-01-01"
        items = self.find(where)
        items.sort(key=lambda m: m.memory_date, reverse=True)
        return items


class MemoryImageRepository(BaseRepository[MemoryImage]):
    table = MEMORY_IMAGES
    model_cls = MemoryImage

    def find_by_memory(self, memory_id: str) -> list[MemoryImage]:
        items = self.find({"memory_id": memory_id})
        items.sort(key=lambda img: img.created_at)
        return items

    def delete_by_memory(self, memory_id: str) -> int:
        images = self.find_by_memory(memory_id)
        count = 0
        for img in images:
            if self.delete(img.id):
                count += 1
        return count