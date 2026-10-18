"""Test Smart Nudge state: snooze 1 lần, version bump, helplines khi crisis, action ownership."""
from __future__ import annotations

from fastapi.testclient import TestClient


def _register(client, email, pw="password123"):
    r = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": pw, "full_name": "T"},
    )
    assert r.status_code == 201
    return r.json()["data"]


def _pair(client, alice_h, bob_h):
    inv = client.post("/api/v1/couple/invite-code", headers=alice_h)
    code = inv.json()["data"]["code"]
    r = client.post(
        "/api/v1/couple/accept-invite", json={"code": code}, headers=bob_h
    )
    assert r.status_code == 200


def _create_nudge(client, alice_h, bob_h):
    r = client.post(
        "/api/v1/moods",
        headers=alice_h,
        json={"mood_score": 2, "reasons": ["work"], "share_level": "all"},
    )
    assert r.status_code == 201
    n = client.get("/api/v1/nudges/active", headers=bob_h).json()["data"]
    return n["id"]


def test_snooze_only_once(client):
    alice = _register(client, "alice_sn@example.com")
    bob = _register(client, "bob_sn@example.com")
    alice_h = {"Authorization": f"Bearer {alice['access_token']}"}
    bob_h = {"Authorization": f"Bearer {bob['access_token']}"}
    _pair(client, alice_h, bob_h)
    nudge_id = _create_nudge(client, alice_h, bob_h)
    # Snooze lần 1 OK
    r1 = client.post(
        f"/api/v1/nudges/{nudge_id}/action",
        json={"action": "snoozed"},
        headers=bob_h,
    )
    assert r1.status_code == 200
    # Snooze lần 2 phải fail (403 hoặc 400)
    r2 = client.post(
        f"/api/v1/nudges/{nudge_id}/action",
        json={"action": "snoozed"},
        headers=bob_h,
    )
    # Sau snooze 1, status vẫn 'new' + snooze_count=1, lần 2 phải bị từ chối
    assert r2.status_code in (400, 403)


def test_nudge_action_ownership(client):
    alice = _register(client, "alice_own@example.com")
    bob = _register(client, "bob_own@example.com")
    charlie = _register(client, "charlie_own@example.com")
    alice_h = {"Authorization": f"Bearer {alice['access_token']}"}
    bob_h = {"Authorization": f"Bearer {bob['access_token']}"}
    charlie_h = {"Authorization": f"Bearer {charlie['access_token']}"}
    _pair(client, alice_h, bob_h)
    nudge_id = _create_nudge(client, alice_h, bob_h)
    # Charlie cố action → 403
    r = client.post(
        f"/api/v1/nudges/{nudge_id}/action",
        json={"action": "completed"},
        headers=charlie_h,
    )
    assert r.status_code == 403


def test_nudge_helplines_when_crisis(client, alice_headers, bob_headers):
    """Khi note chứa crisis keyword → nudge có is_crisis=True + helplines."""
    _pair(client, alice_headers, bob_headers)
    r = client.post(
        "/api/v1/moods",
        headers=alice_headers,
        json={
            "mood": "sad",
            "intensity": 9,
            "note": "Tôi muốn chết quá",
            "mood_score": 1,
            "reasons": ["lonely"],
            "share_level": "all",
        },
    )
    assert r.status_code == 201
    n = client.get("/api/v1/nudges/active", headers=bob_headers).json()["data"]
    assert n is not None
    assert n["is_crisis"] is True
    assert n.get("helplines") is not None
    assert len(n["helplines"]) > 0
    # Hotline phải có name + phone
    assert "name" in n["helplines"][0]
    assert "phone" in n["helplines"][0]


def test_nudge_version_increments_on_update(client, alice_headers, bob_headers):
    _pair(client, alice_headers, bob_headers)
    nudge_id = _create_nudge(client, alice_headers, bob_headers)
    # Initial version
    n1 = client.get(
        f"/api/v1/nudges/active", headers=bob_headers
    ).json()["data"]
    v1 = n1["version"]
    # Action complete
    r = client.post(
        f"/api/v1/nudges/{nudge_id}/action",
        json={"action": "completed"},
        headers=bob_headers,
    )
    assert r.status_code == 200
    # Version phải tăng
    assert r.json()["data"]["version"] > v1


def test_nudge_completed_marks_status(client, alice_headers, bob_headers):
    _pair(client, alice_headers, bob_headers)
    nudge_id = _create_nudge(client, alice_headers, bob_headers)
    r = client.post(
        f"/api/v1/nudges/{nudge_id}/action",
        json={"action": "completed"},
        headers=bob_headers,
    )
    assert r.status_code == 200
    assert r.json()["data"]["status"] == "completed"
    # Sau khi complete, active trả None
    after = client.get(
        "/api/v1/nudges/active", headers=bob_headers
    ).json()["data"]
    assert after is None
