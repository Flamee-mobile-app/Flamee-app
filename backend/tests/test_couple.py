from __future__ import annotations

from datetime import datetime, timezone

from fastapi.testclient import TestClient


def test_unauthenticated_invite_returns_401(client: TestClient):
    response = client.post("/api/v1/couple/invite-code")
    assert response.status_code == 401


def test_empty_invite_lookup_handles_a_missing_postgrest_response():
    from types import SimpleNamespace
    from app.repositories.couple_repo import InviteCodeRepository

    class EmptyQuery:
        def __getattr__(self, _name):
            return lambda *_args, **_kwargs: self

        def execute(self):
            return None

    repo = InviteCodeRepository(SimpleNamespace(table=lambda _table: EmptyQuery()))
    assert repo.find_latest_by_user("user-without-invite") is None
    assert repo.find_active_by_user("user-without-invite") is None


def test_alice_creates_invite(client: TestClient, alice_headers):
    response = client.post(
        "/api/v1/couple/invite-code", headers=alice_headers
    )
    assert response.status_code == 201
    body = response.json()["data"]
    assert len(body["code"]) == 6
    assert body["code"].isalnum()
    expires_at = datetime.fromisoformat(body["expires_at"])
    created_at = datetime.now(timezone.utc)
    assert 71.9 < (expires_at - created_at).total_seconds() / 3600 <= 72
    assert body["status"] == "pending"
    assert body["expires_at"]


def test_bob_accepts_invite_creates_couple(
    client: TestClient, fake_db, alice_headers, bob_headers
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
    assert [call[0] for call in fake_db.rpc_calls] == ["accept_couple_invite"]


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


def test_validate_invite_normalizes_code_and_returns_inviter(
    client: TestClient, alice_headers, bob_headers
):
    code = _create_invite(client, alice_headers)
    response = client.post(
        "/api/v1/couple/validate-invite",
        json={"code": f"  {code.lower()}  "},
        headers=bob_headers,
    )
    assert response.status_code == 200
    assert response.json()["data"]["code"] == code
    assert response.json()["data"]["inviter"]["full_name"] == "Alice"


def test_invite_preview_signs_private_avatar(
    client: TestClient, alice_headers, bob_headers
):
    import base64
    import io

    image = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
    )
    uploaded = client.post(
        "/api/v1/auth/me/avatar",
        headers=alice_headers,
        files={"file": ("avatar.png", io.BytesIO(image), "image/png")},
    )
    assert uploaded.status_code == 200
    code = _create_invite(client, alice_headers)
    preview = client.post(
        "/api/v1/couple/validate-invite",
        json={"code": code},
        headers=bob_headers,
    )
    assert "/storage/v1/object/sign/flamee-media/avatars/" in preview.json()["data"]["inviter"]["avatar_url"]


def test_creator_cannot_validate_own_invite(client: TestClient, alice_headers):
    code = _create_invite(client, alice_headers)
    response = client.post(
        "/api/v1/couple/validate-invite",
        json={"code": code},
        headers=alice_headers,
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "self_invite"


def test_revoke_pending_invite(client: TestClient, alice_headers, bob_headers):
    code = _create_invite(client, alice_headers)
    revoked = client.delete("/api/v1/couple/invite-code", headers=alice_headers)
    assert revoked.status_code == 200
    assert revoked.json()["data"]["status"] == "cancelled"
    rejected = client.post(
        "/api/v1/couple/validate-invite",
        json={"code": code},
        headers=bob_headers,
    )
    assert rejected.status_code == 409
    assert rejected.json()["error"]["code"] == "invite_cancelled"


def test_paired_user_cannot_create_invite(
    client: TestClient, seeded_couple, alice_headers
):
    response = client.post("/api/v1/couple/invite-code", headers=alice_headers)
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "already_paired"


def test_expired_invite_is_persisted_and_reported_distinctly(
    client: TestClient, fake_db, alice_headers, bob_headers
):
    code = _create_invite(client, alice_headers)
    invite = next(row for row in fake_db.table("invite_codes")._data.values() if row["code"] == code)
    invite["expires_at"] = "2000-01-01T00:00:00+00:00"
    response = client.post(
        "/api/v1/couple/validate-invite", json={"code": code}, headers=bob_headers
    )
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "invite_expired"
    current = client.get("/api/v1/couple/invite-code", headers=alice_headers)
    assert current.json()["data"]["status"] == "expired"


def test_accepted_invite_cannot_be_reused(client: TestClient, alice_headers, bob_headers):
    code = _create_invite(client, alice_headers)
    assert client.post("/api/v1/couple/accept-invite", json={"code": code}, headers=bob_headers).status_code == 200
    carol_headers = _register_headers(client, "reuse@example.com", "Secret123", "Reuse")
    response = client.post("/api/v1/couple/accept-invite", json={"code": code}, headers=carol_headers)
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "invite_used"


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
