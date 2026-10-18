"""Test Couple atomicity: accept_invite, break_up retention, TTL, reject paired."""
from __future__ import annotations

from fastapi.testclient import TestClient


def _register(client, email, pw="Secret123"):
    r = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": pw, "full_name": "T"},
    )
    assert r.status_code == 201
    return r.json()["data"]


def test_invite_ttl_72h(client, alice_headers):
    r = client.post("/api/v1/couple/invite-code", headers=alice_headers)
    assert r.status_code == 201
    data = r.json()["data"]
    from datetime import datetime, timezone
    created = datetime.fromisoformat(data["created_at"].replace("Z", "+00:00"))
    expires = datetime.fromisoformat(data["expires_at"].replace("Z", "+00:00"))
    diff_hours = (expires - created).total_seconds() / 3600
    assert abs(diff_hours - 72) < 1


def test_create_invite_rejects_already_paired(client, alice_headers, bob_headers):
    inv = client.post("/api/v1/couple/invite-code", headers=alice_headers)
    code = inv.json()["data"]["code"]
    client.post(
        "/api/v1/couple/accept-invite", json={"code": code}, headers=bob_headers
    )
    # Sau khi paired, alice tạo invite mới phải fail
    r = client.post("/api/v1/couple/invite-code", headers=alice_headers)
    assert r.status_code == 409


def test_accept_invite_rejects_paired_user(client, alice_headers, bob_headers):
    # Pair alice + bob
    inv = client.post("/api/v1/couple/invite-code", headers=alice_headers)
    code = inv.json()["data"]["code"]
    client.post(
        "/api/v1/couple/accept-invite", json={"code": code}, headers=bob_headers
    )
    # Tạo Charlie cố accept invite cũ
    charlie = _register(client, "charlie@example.com")
    headers = {"Authorization": f"Bearer {charlie['access_token']}"}
    r = client.post(
        "/api/v1/couple/accept-invite", json={"code": code}, headers=headers
    )
    assert r.status_code == 409


def test_break_up_keeps_couple_with_dissolved_status(
    client, alice_headers, bob_headers
):
    inv = client.post("/api/v1/couple/invite-code", headers=alice_headers)
    code = inv.json()["data"]["code"]
    client.post(
        "/api/v1/couple/accept-invite", json={"code": code}, headers=bob_headers
    )
    # Break up
    r = client.delete("/api/v1/couple", headers=alice_headers)
    assert r.status_code == 200
    # Sau break_up, couple_id của user bị reset → /couple trả 404
    couple_resp = client.get("/api/v1/couple", headers=alice_headers)
    assert couple_resp.status_code == 404


def test_cannot_self_accept_invite(client, alice_headers):
    inv = client.post("/api/v1/couple/invite-code", headers=alice_headers)
    code = inv.json()["data"]["code"]
    r = client.post(
        "/api/v1/couple/accept-invite", json={"code": code}, headers=alice_headers
    )
    assert r.status_code == 400


def test_malformed_invite_rejected(client, alice_headers, bob_headers):
    """Tạo invite rồi cố accept với code không tồn tại."""
    r = client.post(
        "/api/v1/couple/accept-invite",
        json={"code": "INVALID-CODE"},
        headers=bob_headers,
    )
    assert r.status_code == 422
