from __future__ import annotations

from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_storage
from app.storage.mock_storage import MockStorage


@pytest.fixture
def _per_test_storage():
    """A fresh, non-persisted MockStorage for the current test.

    Wired into the FastAPI app via dependency override so every request
    during this test sees an empty store.
    """
    store = MockStorage(persist_file=None)
    store.clear()  # ensure clean state
    return store


@pytest.fixture
def client(_per_test_storage):
    """FastAPI TestClient with storage reset before each test."""
    from app.main import create_app

    application = create_app()
    application.dependency_overrides[get_storage] = lambda: _per_test_storage
    # The startup event would re-seed from disk; bypass it by overriding
    # the storage dep so app.state is unused for tests.
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