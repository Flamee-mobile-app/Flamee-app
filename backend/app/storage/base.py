from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class Storage(ABC):
    """Abstract data store interface.

    All app code talks to data through this interface so the
    backend (mock / sqlite / postgres) can be swapped via env config
    without touching business logic.

    `where` filter shape (dict of field → condition):
        - {"field": value}                  exact equality
        - {"field__in": [v1, v2, ...]}      membership
        - {"field__gt": v}                  strictly greater than
        - {"field__gte": v}                 greater than or equal
        - {"field__lt": v}                  strictly less than
        - {"field__lte": v}                 less than or equal
        Multiple keys are AND-combined.
    """

    @abstractmethod
    def get(self, table: str, key: str) -> dict | None:
        """Fetch a single record by primary key. Returns None if missing."""

    @abstractmethod
    def find(self, table: str, where: dict | None = None) -> list[dict]:
        """Return all records in `table` matching `where` (None = all)."""

    @abstractmethod
    def find_one(self, table: str, where: dict) -> dict | None:
        """Return the first record matching `where`, or None."""

    @abstractmethod
    def insert(self, table: str, record: dict) -> dict:
        """Insert a new record. Must include an `id` field. Returns the stored record."""

    @abstractmethod
    def update(self, table: str, key: str, patch: dict) -> dict:
        """Merge `patch` into the record identified by `key`. Returns the updated record."""

    @abstractmethod
    def delete(self, table: str, key: str) -> bool:
        """Delete a record by primary key. Returns True if removed."""

    @abstractmethod
    def count(self, table: str, where: dict | None = None) -> int:
        """Count records in `table` matching `where` (None = all)."""

    @abstractmethod
    def clear(self, table: str | None = None) -> None:
        """Remove records. `table=None` clears the entire store (used in tests)."""


_COMPARATORS = {
    "eq": lambda a, e: a == e,
    "in": lambda a, e: a in e,
    "gt": lambda a, e: a is not None and a > e,
    "gte": lambda a, e: a is not None and a >= e,
    "lt": lambda a, e: a is not None and a < e,
    "lte": lambda a, e: a is not None and a <= e,
}


def apply_where(record: dict, where: dict[str, Any] | None) -> bool:
    """Return True iff `record` satisfies every condition in `where`."""
    if not where:
        return True
    for raw_key, expected in where.items():
        field, _, op = raw_key.partition("__")
        op = op or "eq"
        if op not in _COMPARATORS:
            return False
        if not _COMPARATORS[op](record.get(field), expected):
            return False
    return True