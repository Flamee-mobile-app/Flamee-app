"""Draft v2 round-trip/privacy/retry; fixtures are test-only, never runtime."""
from unittest.mock import patch

import pytest


def draft(**changes):
    return dict({
        "draft_version": 2, "mood": "custom", "custom_emotion_label": "Một chút nhớ",
        "mascot_sticker_id": "mascot-neutral", "intensity": 4, "mood_score": 3,
        "sleep_hours": 6, "note": "🙂" * 60,
        "reasons": ["work", "study", "family", "friends"],
        "attachments": [{"kind": "gif", "id": "happy"}, {"kind": "sticker", "id": "mascot-neutral"}],
        "share_level": "all", "timezone": "Asia/Ho_Chi_Minh",
    }, **changes)


def submit(client, headers, payload=None, key="draft-1"):
    return client.post("/api/v1/moods", headers={**headers, "Idempotency-Key": key}, json=payload or draft())


def test_waiting_round_trip_preserves_entire_draft(client, alice_headers):
    with patch("app.services.mood_service.MoodService._trigger_nudge_for_partner") as nudge:
        response = submit(client, alice_headers)
        assert response.status_code == 201, response.text
        saved = response.json()["data"]
        for field, value in draft().items():
            assert saved[field] == value
        assert len(saved["local_date"]) == 10
        assert client.get("/api/v1/moods", headers=alice_headers).json()["data"][0] == saved
        nudge.assert_not_called()


@pytest.mark.parametrize("change", [
    {"note": "🙂" * 61}, {"intensity": 6}, {"sleep_hours": 1},
    {"user_id": "someone-else"}, {"timezone": "not/a_zone"},
    {"attachments": [{"kind": "gif", "id": "happy"}, {"kind": "gif", "id": "sad"}]},
])
def test_invalid_draft_is_rejected(client, alice_headers, change):
    assert submit(client, alice_headers, draft(**change)).status_code == 422


def test_version2_requires_idempotency_key(client, alice_headers):
    assert client.post("/api/v1/moods", headers=alice_headers, json=draft()).status_code == 422


def test_replay_returns_one_record_and_enqueues_once(client, alice_headers, seeded_couple, fake_db):
    with patch("app.services.mood_service.MoodService._trigger_nudge_for_partner") as nudge:
        first = submit(client, alice_headers)
        second = submit(client, alice_headers)
        assert first.status_code == second.status_code == 201
        assert first.json()["data"] == second.json()["data"]
        assert len(fake_db.table("moods")._data) == 1
        assert nudge.call_count == 1
    assert submit(client, alice_headers, draft(note="Changed")).status_code == 409


def test_same_key_is_owner_scoped(client, alice_headers, bob_headers):
    assert submit(client, alice_headers).json()["data"]["id"] != submit(client, bob_headers).json()["data"]["id"]


def test_mood_only_projects_new_fields_and_private_overrides_all(client, alice_headers, bob_headers, seeded_couple):
    with patch("app.services.mood_service.MoodService._trigger_nudge_for_partner"):
        assert submit(client, alice_headers, draft(share_level="mood_only")).status_code == 201
    partner = client.get("/api/v1/moods/partner/latest", headers=bob_headers).json()["data"]["latest_mood"]
    for field in ("note", "reasons", "custom_emotion_label", "mascot_sticker_id", "sleep_hours"):
        assert partner[field] is None
    assert partner["attachments"] == []
    owner = client.get("/api/v1/moods", headers=alice_headers).json()["data"][0]
    assert owner["sleep_hours"] == 6
    with patch("app.services.mood_service.MoodService._trigger_nudge_for_partner") as nudge:
        private = submit(client, alice_headers, draft(is_private=True), key="private")
        assert private.json()["data"]["share_level"] == "private"
        nudge.assert_not_called()


def test_waiting_record_is_not_backfilled_and_key_cannot_cross_couple(client, alice_headers, bob_headers):
    first = submit(client, alice_headers)
    assert first.status_code == 201
    code = client.post("/api/v1/couple/invite-code", headers=alice_headers).json()["data"]["code"]
    assert client.post("/api/v1/couple/accept-invite", headers=bob_headers, json={"code": code}).status_code == 200
    assert client.get("/api/v1/moods/partner/latest", headers=bob_headers).json()["data"]["latest_mood"] is None
    assert submit(client, alice_headers).status_code == 409


def test_concurrent_unique_insert_replays_persisted_record_without_second_nudge(client, alice_headers, monkeypatch):
    from app.repositories.mood_repo import MoodRepository
    from postgrest.exceptions import APIError
    create = MoodRepository.create_mood

    def concurrent_insert(repository, fields):
        # Simulate the competing transaction winning the same PK before ours.
        create(repository, fields)
        raise APIError({"code": "23505", "message": "duplicate primary key", "details": "", "hint": ""})

    monkeypatch.setattr(MoodRepository, "create_mood", concurrent_insert)
    with patch("app.services.mood_service.MoodService._trigger_nudge_for_partner") as nudge:
        response = submit(client, alice_headers)
        assert response.status_code == 201
        assert response.json()["data"]["note"] == draft()["note"]
        nudge.assert_not_called()
