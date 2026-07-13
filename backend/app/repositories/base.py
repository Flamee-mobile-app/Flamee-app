from __future__ import annotations

from typing import Any, Generic, TypeVar

from app.core.exceptions import NotFoundError
from app.storage.base import Storage

T = TypeVar("T")


class BaseRepository(Generic[T]):
    """Generic CRUD repository over a Storage instance.

    Subclasses set `table` (storage collection name) and `model_cls`
    (dataclass used to wrap rows).
    """

    table: str = ""
    model_cls: type[T] = type(None)  # placeholder, overridden in subclasses

    def __init__(self, storage: Storage) -> None:
        self.storage = storage

    def get(self, id: str) -> T | None:
        row = self.storage.get(self.table, id)
        return self.model_cls.from_dict(row) if row else None

    def find(self, where: dict[str, Any] | None = None) -> list[T]:
        rows = self.storage.find(self.table, where=where)
        return [self.model_cls.from_dict(r) for r in rows]

    def find_one(self, where: dict[str, Any]) -> T | None:
        row = self.storage.find_one(self.table, where=where)
        return self.model_cls.from_dict(row) if row else None

    def insert(self, model: T) -> T:
        self.storage.insert(self.table, model.to_dict())
        return model

    def create(self, **fields: Any) -> T:
        instance = self.model_cls(**fields)
        return self.insert(instance)

    def update(self, id: str, **patch: Any) -> T:
        try:
            updated = self.storage.update(self.table, id, patch)
        except NotFoundError:
            raise
        return self.model_cls.from_dict(updated)

    def upsert(self, id: str, **fields: Any) -> T:
        """Insert if missing, otherwise update. Returns the resulting model."""
        if self.storage.get(self.table, id) is None:
            instance = self.model_cls(id=id, **fields)
            return self.insert(instance)
        return self.update(id, **fields)

    def delete(self, id: str) -> bool:
        return self.storage.delete(self.table, id)

    def count(self, where: dict[str, Any] | None = None) -> int:
        return self.storage.count(self.table, where=where)