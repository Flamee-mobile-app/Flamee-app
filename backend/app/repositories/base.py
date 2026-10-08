from __future__ import annotations

from typing import Any, Generic, TypeVar

from supabase import Client

from app.core.exceptions import NotFoundError

T = TypeVar("T")


class BaseRepository(Generic[T]):
    """Generic CRUD repository over a Supabase table.

    Subclasses set `table` (Supabase table name) and `model_cls`
    (dataclass used to wrap rows).
    """

    table: str = ""
    model_cls: type[T] = type(None)  # placeholder, overridden in subclasses

    def __init__(self, db: Client) -> None:
        self.db = db

    def get(self, id: str) -> T | None:
        resp = self.db.table(self.table).select("*").eq("id", id).maybe_single().execute()
        if not resp:
            return None
        data = getattr(resp, "data", None)
        return self.model_cls.from_dict(data) if data else None

    def find(self, where: dict[str, Any] | None = None) -> list[T]:
        query = self.db.table(self.table).select("*")
        if where:
            for key, value in where.items():
                if "__" in key:
                    field, op = key.rsplit("__", 1)
                    if op == "in":
                        query = query.in_(field, value)
                    elif op == "gt":
                        query = query.gt(field, value)
                    elif op == "gte":
                        query = query.gte(field, value)
                    elif op == "lt":
                        query = query.lt(field, value)
                    elif op == "lte":
                        query = query.lte(field, value)
                else:
                    query = query.eq(key, value)
        resp = query.execute()
        if not resp:
            return []
        data = getattr(resp, "data", [])
        return [self.model_cls.from_dict(r) for r in data]

    def find_one(self, where: dict[str, Any]) -> T | None:
        query = self.db.table(self.table).select("*")
        for key, value in where.items():
            if "__" in key:
                field, op = key.rsplit("__", 1)
                if op == "in":
                    query = query.in_(field, value)
                elif op == "gt":
                    query = query.gt(field, value)
                elif op == "gte":
                    query = query.gte(field, value)
                elif op == "lt":
                    query = query.lt(field, value)
                elif op == "lte":
                    query = query.lte(field, value)
            else:
                query = query.eq(key, value)
        resp = query.limit(1).maybe_single().execute()
        if not resp:
            return None
        data = getattr(resp, "data", None)
        return self.model_cls.from_dict(data) if data else None

    def create(self, **fields: Any) -> T:
        instance = self.model_cls(**fields)
        resp = self.db.table(self.table).insert(instance.to_dict()).execute()
        return self.model_cls.from_dict(resp.data[0])

    def update(self, id: str, **patch: Any) -> T:
        resp = self.db.table(self.table).update(patch).eq("id", id).execute()
        if not resp.data:
            raise NotFoundError(f"{self.table}#{id} not found")
        return self.model_cls.from_dict(resp.data[0])

    def delete(self, id: str) -> bool:
        resp = self.db.table(self.table).delete().eq("id", id).execute()
        return bool(resp.data)

    def count(self, where: dict[str, Any] | None = None) -> int:
        query = self.db.table(self.table).select("id", count="exact")
        if where:
            for key, value in where.items():
                query = query.eq(key, value)
        resp = query.execute()
        return resp.count or 0