from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path
from typing import Any

from app.core.exceptions import NotFoundError
from app.storage.base import Storage, apply_where


class MockStorage(Storage):
    """In-memory dict-based storage with optional JSON persistence.

    Layout: self._db[table][id] = record (a dict).
    """

    def __init__(self, persist_file: Path | None = None) -> None:
        self._db: dict[str, dict[str, dict]] = {}
        self._persist_file: Path | None = persist_file

    # ---- persistence -----------------------------------------------------
    def load_from_file(self) -> None:
        """Restore state from the configured JSON file (no-op if missing)."""
        if self._persist_file is None or not self._persist_file.exists():
            return
        raw = json.loads(self._persist_file.read_text(encoding="utf-8"))
        self._db = {table: {rid: rec for rid, rec in records.items()} for table, records in raw.items()}

    def flush(self) -> None:
        """Force-write current state to the configured JSON file."""
        if self._persist_file is None:
            return
        self._persist_file.parent.mkdir(parents=True, exist_ok=True)
        self._persist_file.write_text(json.dumps(self._db, default=str, ensure_ascii=False), encoding="utf-8")

    # ---- helpers ----------------------------------------------------------
    def _table(self, table: str) -> dict[str, dict]:
        return self._db.setdefault(table, {})

    def _matches(self, record: dict, where: dict | None) -> bool:
        return apply_where(record, where)

    # ---- CRUD -------------------------------------------------------------
    def get(self, table: str, key: str) -> dict | None:
        return self._db.get(table, {}).get(key)

    def find(self, table: str, where: dict | None = None) -> list[dict]:
        records = self._db.get(table, {})
        return [deepcopy(rec) for rec in records.values() if self._matches(rec, where)]

    def find_one(self, table: str, where: dict) -> dict | None:
        records = self._db.get(table, {})
        for rec in records.values():
            if self._matches(rec, where):
                return deepcopy(rec)
        return None

    def insert(self, table: str, record: dict) -> dict:
        record_id = record.get("id")
        if not record_id:
            raise ValueError("record must include an 'id' field")
        stored = deepcopy(record)
        self._table(table)[record_id] = stored
        self.flush()
        return deepcopy(stored)

    def update(self, table: str, key: str, patch: dict) -> dict:
        existing = self._table(table).get(key)
        if existing is None:
            raise NotFoundError(f"{table}#{key} not found")
        existing.update(deepcopy(patch))
        self.flush()
        return deepcopy(existing)

    def delete(self, table: str, key: str) -> bool:
        removed = self._table(table).pop(key, None)
        if removed is None:
            return False
        self.flush()
        return True

    def count(self, table: str, where: dict | None = None) -> int:
        records = self._db.get(table, {})
        return sum(1 for rec in records.values() if self._matches(rec, where))

    def clear(self, table: str | None = None) -> None:
        if table is None:
            self._db.clear()
        else:
            self._db.pop(table, None)
        self.flush()

    # ---- debug ------------------------------------------------------------
    def snapshot(self) -> dict[str, Any]:
        """Return a deep copy of the entire store (used by tests / seeds)."""
        return deepcopy(self._db)