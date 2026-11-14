from __future__ import annotations

import io
from PIL import Image


def _payload():
    return {"title": "Our memory", "category": "moment", "memory_date": "2026-10-18"}


def _photo():
    data = io.BytesIO()
    Image.new("RGB", (40, 30), "coral").save(data, format="JPEG")
    data.seek(0)
    return data


def test_replaying_create_key_returns_the_same_memory(client, alice_headers, seeded_couple, fake_db):
    headers = {**alice_headers, "Idempotency-Key": "same-post-1"}
    first = client.post("/api/v1/memories", headers=headers, json=_payload())
    second = client.post("/api/v1/memories", headers=headers, json=_payload())
    assert first.status_code == second.status_code == 201
    assert first.json()["data"]["id"] == second.json()["data"]["id"]
    assert len(fake_db.table("memories")._data) == 1


def test_create_key_is_scoped_to_the_authenticated_user(client, alice_headers, bob_headers, seeded_couple):
    first = client.post("/api/v1/memories", headers={**alice_headers, "Idempotency-Key": "same-key"}, json=_payload())
    second = client.post("/api/v1/memories", headers={**bob_headers, "Idempotency-Key": "same-key"}, json=_payload())
    assert first.json()["data"]["id"] != second.json()["data"]["id"]


def test_changed_payload_cannot_reuse_a_create_key(client, alice_headers, seeded_couple):
    headers = {**alice_headers, "Idempotency-Key": "same-post-1"}
    client.post("/api/v1/memories", headers=headers, json=_payload())
    changed = client.post("/api/v1/memories", headers=headers, json={**_payload(), "title": "Different"})
    assert changed.status_code == 409


def test_replaying_image_upload_returns_existing_asset_without_duplicate_objects(client, alice_headers, seeded_couple, fake_db):
    memory = client.post("/api/v1/memories", headers=alice_headers, json=_payload()).json()["data"]
    route = f"/api/v1/memories/{memory['id']}/images"
    headers = {**alice_headers, "Idempotency-Key": "same-photo-1"}
    first = client.post(route, headers=headers, files={"file": ("photo.jpg", _photo(), "image/jpeg")})
    second = client.post(route, headers=headers, files={"file": ("photo.jpg", _photo(), "image/jpeg")})
    assert first.status_code == second.status_code == 201
    assert first.json()["data"]["id"] == second.json()["data"]["id"]
    assert len(fake_db.table("memory_images")._data) == 1
    assert len(fake_db.storage.buckets["flamee-media"].objects) == 2


def test_replaying_create_after_upload_returns_a_signed_image(client, alice_headers, seeded_couple):
    headers = {**alice_headers, "Idempotency-Key": "post-with-image"}
    created = client.post("/api/v1/memories", headers=headers, json=_payload()).json()["data"]
    upload = client.post(f"/api/v1/memories/{created['id']}/images", headers=headers, files={"file": ("photo.jpg", _photo(), "image/jpeg")})
    assert upload.status_code == 201
    replay = client.post("/api/v1/memories", headers=headers, json=_payload())
    assert replay.status_code == 201
    assert replay.json()["data"]["images"][0]["id"] == upload.json()["data"]["id"]
    assert "/sign/flamee-media/" in replay.json()["data"]["images"][0]["url"]
