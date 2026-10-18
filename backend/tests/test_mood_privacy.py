"""Test Mood privacy: enum, share_level, partner không thấy private/mood_only note."""
from __future__ import annotations

from fastapi.testclient import TestClient


def _register(client, email, pw="Secret123"):
    r = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": pw, "full_name": "T"},
    )
    assert r.status_code == 201
    return r.json()["data"]


def _pair(client, alice_h, bob_h):
    inv = client.post("/api/v1/couple/invite-code", headers=alice_h)
    code = inv.json()["data"]["code"]
    acc = client.post(
        "/api/v1/couple/accept-invite", json={"code": code}, headers=bob_h
    )
    assert acc.status_code == 200


def test_mood_enum_rejects_unknown(client, alice_headers, bob_headers):
    _pair(client, alice_headers, bob_headers)
    r = client.post(
        "/api/v1/moods",
        headers=alice_headers,
        json={"mood": "not_a_real_mood", "intensity": 5, "mood_score": 3},
    )
    assert r.status_code == 422


def test_mood_enum_accepts_known(client, alice_headers, bob_headers):
    _pair(client, alice_headers, bob_headers)
    r = client.post(
        "/api/v1/moods",
        headers=alice_headers,
        json={"mood": "love", "intensity": 5, "mood_score": 5},
    )
    assert r.status_code == 201


def test_partner_does_not_see_private_mood(client, alice_headers, bob_headers):
    _pair(client, alice_headers, bob_headers)
    client.post(
        "/api/v1/moods",
        headers=alice_headers,
        json={
            "mood": "sad",
            "intensity": 7,
            "note": "private note",
            "is_private": True,
            "mood_score": 2,
            "reasons": ["work"],
            "share_level": "private",
        },
    )
    r = client.get("/api/v1/moods/partner/latest", headers=bob_headers).json()["data"]
    assert r["latest_mood"] is None


def test_mood_only_hides_note_for_partner(client, alice_headers, bob_headers):
    _pair(client, alice_headers, bob_headers)
    client.post(
        "/api/v1/moods",
        headers=alice_headers,
        json={
            "mood": "happy",
            "intensity": 5,
            "note": "secret note about surprise",
            "mood_score": 4,
            "reasons": ["gift"],
            "share_level": "mood_only",
        },
    )
    r = client.get(
        "/api/v1/moods/partner/latest", headers=bob_headers
    ).json()["data"]
    assert r["latest_mood"] is not None
    # Note bị ẩn
    assert r["latest_mood"]["note"] is None


def test_share_all_shows_full_to_partner(client, alice_headers, bob_headers):
    _pair(client, alice_headers, bob_headers)
    client.post(
        "/api/v1/moods",
        headers=alice_headers,
        json={
            "mood": "happy",
            "intensity": 5,
            "note": "Visible note",
            "mood_score": 4,
            "reasons": ["gift"],
            "share_level": "all",
        },
    )
    r = client.get(
        "/api/v1/moods/partner/latest", headers=bob_headers
    ).json()["data"]
    assert r["latest_mood"]["note"] == "Visible note"


def test_invalid_share_level_rejected(client, alice_headers, bob_headers):
    _pair(client, alice_headers, bob_headers)
    r = client.post(
        "/api/v1/moods",
        headers=alice_headers,
        json={
            "mood": "happy",
            "intensity": 5,
            "mood_score": 3,
            "share_level": "invalid_value",
        },
    )
    assert r.status_code == 422
