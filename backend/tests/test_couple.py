from __future__ import annotations

from fastapi.testclient import TestClient


def test_unauthenticated_invite_returns_401(client: TestClient):
    response = client.post("/api/v1/couple/invite-code")
    assert response.status_code == 401


def test_alice_creates_invite(client: TestClient, alice_headers):
    response = client.post(
        "/api/v1/couple/invite-code", headers=alice_headers
    )
    assert response.status_code == 201
    body = response.json()["data"]
    assert body["code"].startswith("FLM-")
    assert body["status"] == "pending"
    assert body["expires_at"]


def test_bob_accepts_invite_creates_couple(
    client: TestClient, alice_headers, bob_headers
):
    create_resp = client.post(
        "/api/v1/couple/invite-code", headers=alice_headers
    )
    code = create_resp.json()["data"]["code"]

    accept = client.post(
        "/api/v1/couple/accept-invite",
        json={"code": code},
        headers=bob_headers,
    )
    assert accept.status_code == 200
    data = accept.json()["data"]
    assert data["status"] == "active"
    assert data["partner1"] is not None
    assert data["partner2"] is not None

    alice_view = client.get("/api/v1/couple", headers=alice_headers)
    assert alice_view.status_code == 200
    bob_view = client.get("/api/v1/couple", headers=bob_headers)
    assert bob_view.status_code == 200
    assert alice_view.json()["data"]["id"] == bob_view.json()["data"]["id"]


def test_invite_endpoint_shows_accepted_for_creator(
    client: TestClient, alice_headers, bob_headers
):
    code = _create_invite(client, alice_headers)
    client.post(
        "/api/v1/couple/accept-invite",
        json={"code": code},
        headers=bob_headers,
    )
    response = client.get(
        "/api/v1/couple/invite-code", headers=alice_headers
    )
    body = response.json()["data"]
    assert body is not None
    assert body["status"] == "accepted"
    assert body["is_pending"] is False

    carol_headers = _register_headers(
        client, "carol@example.com", "Secret123", "Carol"
    )
    create2 = client.post(
        "/api/v1/couple/invite-code", headers=carol_headers
    )
    assert create2.json()["data"]["is_pending"] is True


def _create_invite(client: TestClient, headers: dict) -> str:
    response = client.post("/api/v1/couple/invite-code", headers=headers)
    return response.json()["data"]["code"]


def _register_headers(
    client: TestClient, email: str, password: str, full_name: str
) -> dict:
    data = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": full_name},
    ).json()["data"]
    return {"Authorization": f"Bearer {data['access_token']}"}


def test_update_anniversary_by_member(
    client: TestClient, seeded_couple, alice_headers, bob_headers
):
    response = client.put(
        "/api/v1/couple/anniversary",
        json={"anniversary": "2024-06-15"},
        headers=alice_headers,
    )
    assert response.status_code == 200
    assert response.json()["data"]["anniversary"] == "2024-06-15"

    bob_view = client.get("/api/v1/couple", headers=bob_headers)
    assert bob_view.json()["data"]["anniversary"] == "2024-06-15"


def test_update_anniversary_by_non_member_returns_404(client: TestClient):
    headers = client.post(
        "/api/v1/auth/register",
        json={
            "email": "solo@example.com",
            "password": "Secret123",
            "full_name": "Solo",
        },
    ).json()["data"]
    auth = {"Authorization": f"Bearer {headers['access_token']}"}
    response = client.put(
        "/api/v1/couple/anniversary",
        json={"anniversary": "2024-01-01"},
        headers=auth,
    )
    assert response.status_code == 404