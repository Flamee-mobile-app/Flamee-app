from app.repositories.mood_repo import MoodRepository, MoodAlertRepository


def row(id, user="a", couple="ab", **patch):
    return dict(id=id, user_id=user, couple_id=couple, mood="happy", intensity=5,
                note="private detail", is_private=False, created_at=f"2026-10-27T10:00:{id[-2:]}+00:00",
                mood_score=4, reasons=["work"], share_level="all", **patch)


def test_history_pages_are_owner_scoped(client, alice_headers, bob_headers, fake_db):
    alice = client.get("/api/v1/auth/me", headers=alice_headers).json()["data"]["id"]
    bob = client.get("/api/v1/auth/me", headers=bob_headers).json()["data"]["id"]
    for i in range(4):
        fake_db.table("moods").insert(row(f"m{i:02}", user=alice)).execute()
    fake_db.table("moods").insert(row("m99", user=bob)).execute()
    first = client.get("/api/v1/moods?limit=2&offset=0", headers=alice_headers)
    second = client.get("/api/v1/moods?limit=2&offset=2", headers=alice_headers)
    assert first.status_code == second.status_code == 200
    assert [r["id"] for r in first.json()["data"]] == ["m03", "m02"]
    assert [r["id"] for r in second.json()["data"]] == ["m01", "m00"]
    assert client.get("/api/v1/moods?limit=101", headers=alice_headers).status_code == 422
    assert client.get("/api/v1/moods?offset=-1", headers=alice_headers).status_code == 422


def test_partner_projection_excludes_old_couple_and_legacy_private(fake_db):
    repo = MoodRepository(fake_db)
    for record in [row("m01"), row("m03", couple="old"), {**row("m02"), "is_private": True}]:
        repo.create_mood(record)
    assert repo.get_latest_shareable_mood("a", "ab").id == "m01"
    assert repo.get_latest_shareable_mood("a", "unknown") is None


def test_digest_scope_and_mood_only_projection(fake_db):
    repo = MoodRepository(fake_db)
    for record in [row("m01", couple="old"), {**row("m02"), "share_level": "private"}, {**row("m03"), "share_level": "mood_only"}]:
        repo.create_mood(record)
    records = repo.get_shareable_moods_by_date("a", "2026-10-27", "ab")
    assert len(records) == 1
    assert records[0].id == "m03"
    assert records[0].note is None and records[0].reasons is None
    assert repo.get_recent_moods("a")[0].note == "private detail"


def test_partner_alert_does_not_cross_couple_boundary(fake_db):
    repo = MoodAlertRepository(fake_db)
    repo.create_alert(dict(id="alert", couple_id="old", user_id="a", alert_type="low",
                           title="Old alert", message="old", advice="old", is_read=False,
                           created_at="2026-10-27T10:00:00+00:00"))
    assert repo.get_active_alert_for_partner("a", "ab") is None


def test_legacy_private_flag_cannot_be_overridden_by_default_all(client, alice_headers, bob_headers, seeded_couple):
    result = client.post("/api/v1/moods", headers=alice_headers,
                         json={"mood": "happy", "is_private": True, "note": "only me"})
    assert result.status_code == 201
    assert result.json()["data"]["share_level"] == "private"
    partner = client.get("/api/v1/moods/partner/latest", headers=bob_headers).json()["data"]
    assert partner["latest_mood"] is None
