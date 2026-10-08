from __future__ import annotations

from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_db


class FakeSupabaseTable:
    """In-memory table emulating Supabase PostgREST API for tests."""

    def __init__(self) -> None:
        self._data: dict[str, dict] = {}
        self._query_filters: list = []
        self._limit_val: int | None = None
        self._single: bool = False
        self._order_field: str | None = None
        self._order_desc: bool = False
        self._count_mode: str | None = None
        self._select_cols: str = "*"

    def _reset_query(self) -> "FakeSupabaseTable":
        self._query_filters = []
        self._limit_val = None
        self._single = False
        self._order_field = None
        self._order_desc = False
        self._count_mode = None
        self._select_cols = "*"
        return self

    def select(self, cols: str = "*", count: str | None = None) -> "FakeSupabaseTable":
        self._reset_query()
        self._select_cols = cols
        self._count_mode = count
        return self

    def eq(self, field: str, value: Any) -> "FakeSupabaseTable":
        self._query_filters.append(("eq", field, value))
        return self

    def gt(self, field: str, value: Any) -> "FakeSupabaseTable":
        self._query_filters.append(("gt", field, value))
        return self

    def gte(self, field: str, value: Any) -> "FakeSupabaseTable":
        self._query_filters.append(("gte", field, value))
        return self

    def lt(self, field: str, value: Any) -> "FakeSupabaseTable":
        self._query_filters.append(("lt", field, value))
        return self

    def lte(self, field: str, value: Any) -> "FakeSupabaseTable":
        self._query_filters.append(("lte", field, value))
        return self

    def in_(self, field: str, values: list) -> "FakeSupabaseTable":
        self._query_filters.append(("in", field, values))
        return self

    def order(self, field: str, desc: bool = False) -> "FakeSupabaseTable":
        self._order_field = field
        self._order_desc = desc
        return self

    def limit(self, n: int) -> "FakeSupabaseTable":
        self._limit_val = n
        return self

    def maybe_single(self) -> "FakeSupabaseTable":
        self._single = True
        return self

    def _apply_filters(self) -> list[dict]:
        results = list(self._data.values())
        for op, field, value in self._query_filters:
            if op == "eq":
                results = [r for r in results if r.get(field) == value]
            elif op == "gt":
                results = [r for r in results if r.get(field) is not None and r.get(field) > value]
            elif op == "gte":
                results = [r for r in results if r.get(field) is not None and r.get(field) >= value]
            elif op == "lt":
                results = [r for r in results if r.get(field) is not None and r.get(field) < value]
            elif op == "lte":
                results = [r for r in results if r.get(field) is not None and r.get(field) <= value]
            elif op == "in":
                results = [r for r in results if r.get(field) in value]
        if self._order_field:
            results.sort(key=lambda r: r.get(self._order_field, ""), reverse=self._order_desc)
        if self._limit_val:
            results = results[: self._limit_val]
        return results

    def execute(self) -> Any:
        results = self._apply_filters()
        resp = MagicMock()
        if self._single:
            resp.data = results[0] if results else None
        else:
            resp.data = results
        resp.count = len(list(self._data.values())) if self._count_mode else None
        self._reset_query()
        return resp

    def insert(self, record: dict) -> "FakeSupabaseTable":
        self._pending_insert = record
        return self

    def update(self, patch: dict) -> "FakeSupabaseTable":
        self._pending_update = patch
        return self

    def delete(self) -> "FakeSupabaseTable":
        self._pending_delete = True
        return self


class _InsertChain(FakeSupabaseTable):
    pass


class FakeSupabaseClient:
    """In-memory Supabase client for testing."""

    def __init__(self) -> None:
        self._tables: dict[str, FakeSupabaseTable] = {}
        
        class FakeBucket:
            def upload(self, *args, **kwargs):
                return MagicMock()
            def remove(self, *args, **kwargs):
                return MagicMock()
            def get_public_url(self, path: str) -> str:
                return f"https://fake-supabase.co/storage/v1/object/public/{path}"

        class FakeStorage:
            def from_(self, bucket: str) -> FakeBucket:
                return FakeBucket()
                
        self.storage = FakeStorage()

    def table(self, name: str) -> FakeSupabaseTable:
        if name not in self._tables:
            self._tables[name] = FakeSupabaseTable()
        tbl = self._tables[name]

        # Patch insert to actually store data
        original_insert = tbl.insert

        def patched_insert(record: dict):
            rec_id = record.get("id")
            if rec_id:
                tbl._data[rec_id] = dict(record)

            class InsertResult:
                def execute(self_inner):
                    resp = MagicMock()
                    resp.data = [record]
                    return resp

            return InsertResult()

        tbl.insert = patched_insert

        # Patch update to actually modify data
        def patched_update(patch: dict):
            class UpdateChain:
                def __init__(self_inner):
                    self_inner._patch = patch
                    self_inner._filters = []

                def eq(self_inner, field, value):
                    self_inner._filters.append((field, value))
                    return self_inner

                def execute(self_inner):
                    results = []
                    for rec_id, rec in list(tbl._data.items()):
                        match = all(rec.get(f) == v for f, v in self_inner._filters)
                        if match:
                            rec.update(self_inner._patch)
                            results.append(rec)
                    resp = MagicMock()
                    resp.data = results
                    return resp

            return UpdateChain()

        tbl.update = patched_update

        # Patch delete to actually remove data
        def patched_delete():
            class DeleteChain:
                def __init__(self_inner):
                    self_inner._filters = []

                def eq(self_inner, field, value):
                    self_inner._filters.append((field, value))
                    return self_inner

                def execute(self_inner):
                    removed = []
                    for rec_id in list(tbl._data.keys()):
                        rec = tbl._data[rec_id]
                        match = all(rec.get(f) == v for f, v in self_inner._filters)
                        if match:
                            removed.append(tbl._data.pop(rec_id))
                    resp = MagicMock()
                    resp.data = removed
                    return resp

            return DeleteChain()

        tbl.delete = patched_delete

        return tbl

    def clear_all(self) -> None:
        for tbl in self._tables.values():
            tbl._data.clear()


@pytest.fixture
def fake_db():
    """A fresh, in-memory FakeSupabaseClient for each test."""
    return FakeSupabaseClient()


@pytest.fixture
def client(fake_db):
    """FastAPI TestClient with Supabase mocked for each test."""
    from app.main import create_app

    application = create_app()
    application.dependency_overrides[get_db] = lambda: fake_db
    test_client = TestClient(application)
    yield test_client
    application.dependency_overrides.clear()


def _register_user(
    client: TestClient,
    email: str,
    password: str,
    full_name: str,
) -> dict[str, Any]:
    response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": full_name},
    )
    assert response.status_code == 201, response.text
    return response.json()["data"]


@pytest.fixture
def alice_headers(client: TestClient) -> dict[str, str]:
    data = _register_user(
        client, "alice@example.com", "Secret123", "Alice"
    )
    return {"Authorization": f"Bearer {data['access_token']}"}


@pytest.fixture
def bob_headers(client: TestClient) -> dict[str, str]:
    data = _register_user(client, "bob@example.com", "Secret123", "Bob")
    return {"Authorization": f"Bearer {data['access_token']}"}


@pytest.fixture
def seeded_couple(client: TestClient, alice_headers, bob_headers):
    """Have alice create an invite and bob accept it. Returns the invite code."""
    create_resp = client.post(
        "/api/v1/couple/invite-code", headers=alice_headers
    )
    assert create_resp.status_code == 201, create_resp.text
    invite_code = create_resp.json()["data"]["code"]
    accept_resp = client.post(
        "/api/v1/couple/accept-invite",
        json={"code": invite_code},
        headers=bob_headers,
    )
    assert accept_resp.status_code == 200, accept_resp.text
    return invite_code