from __future__ import annotations

import io
import base64
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.repositories.memory_repo import MemoryImageRepository

_TINY_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
)


def test_unauthenticated_list_returns_401(client: TestClient):
    response = client.get("/api/v1/memories")
    assert response.status_code == 401


def test_create_without_couple_returns_404(
    client: TestClient, alice_headers
):
    response = client.post(
        "/api/v1/memories",
        json={
            "title": "Solo memory",
            "category": "moment",
            "memory_date": "2025-01-01",
        },
        headers=alice_headers,
    )
    assert response.status_code == 404


def test_memory_create_and_listing(
    client: TestClient, alice_headers, bob_headers, seeded_couple
):
    memory_id = _create_memory(client, alice_headers)
    listing = client.get("/api/v1/memories", headers=bob_headers).json()["data"]
    assert listing["total"] == 1
    assert listing["items"][0]["id"] == memory_id


def test_memory_feed_contains_real_author_and_caption_without_private_user_fields(
    client: TestClient, alice_headers, bob_headers, seeded_couple, fake_db
):
    memory_id = _create_memory(client, alice_headers, description="Our day")
    response = client.get("/api/v1/memories", headers=bob_headers)
    assert response.status_code == 200
    item = response.json()["data"]["items"][0]
    assert item["id"] == memory_id
    assert item["description"] == "Our day"
    assert item["created_at"]
    assert item["author"]["id"] == item["created_by"]
    assert item["author"]["full_name"] == "Alice"
    assert set(item["author"]) == {"id", "full_name", "username", "avatar_url"}
    assert "email" not in item["author"]
    assert "password_hash" not in item["author"]


def test_feed_does_not_expose_author_from_another_couple(
    client: TestClient, alice_headers, bob_headers, seeded_couple, fake_db
):
    memory_id = _create_memory(client, alice_headers)
    alice = next(user for user in fake_db.table("users")._data.values() if user["full_name"] == "Alice")
    alice["couple_id"] = "another-couple"
    item = client.get("/api/v1/memories", headers=bob_headers).json()["data"]["items"][0]
    assert item["id"] == memory_id
    assert item["author"] is None


def test_feed_author_avatar_is_signed_without_exposing_storage_paths(
    client: TestClient, alice_headers, bob_headers, seeded_couple
):
    upload = client.post(
        "/api/v1/auth/me/avatar", headers=alice_headers,
        files={"file": ("avatar.png", io.BytesIO(_TINY_PNG), "image/png")},
    )
    assert upload.status_code == 200, upload.text
    _create_memory(client, alice_headers)
    author = client.get("/api/v1/memories", headers=bob_headers).json()["data"]["items"][0]["author"]
    assert "/sign/flamee-media/avatars/" in author["avatar_url"]
    assert "avatar_storage_path" not in author


def test_memory_get_returns_detail(
    client: TestClient, alice_headers, bob_headers, seeded_couple
):
    create_resp = client.post(
        "/api/v1/memories",
        json={
            "title": "First kiss",
            "category": "first_date",
            "memory_date": "2025-02-14",
            "location": "Park",
            "is_pinned": True,
        },
        headers=alice_headers,
    )
    memory_id = create_resp.json()["data"]["id"]
    detail = client.get(
        f"/api/v1/memories/{memory_id}", headers=bob_headers
    ).json()["data"]
    assert detail["title"] == "First kiss"
    assert detail["images"] == []


def test_memory_update_and_delete(
    client: TestClient, alice_headers, seeded_couple
):
    memory_id = _create_memory(client, alice_headers)
    update = client.put(
        f"/api/v1/memories/{memory_id}",
        json={"title": "Renamed", "is_pinned": False},
        headers=alice_headers,
    ).json()["data"]
    assert update["title"] == "Renamed"
    delete = client.delete(
        f"/api/v1/memories/{memory_id}", headers=alice_headers
    )
    assert delete.status_code == 204
    after = client.get(
        "/api/v1/memories", headers=alice_headers
    ).json()["data"]
    assert after["total"] == 0


def test_image_upload_then_listed_in_detail(
    client: TestClient, alice_headers, bob_headers, seeded_couple, fake_db
):
    memory_id = _create_memory(client, alice_headers, title="Image test")
    upload = client.post(
        f"/api/v1/memories/{memory_id}/images",
        headers=alice_headers,
        files={"file": ("test.png", io.BytesIO(_TINY_PNG), "image/png")},
    )
    assert upload.status_code == 201, upload.text
    payload = upload.json()["data"]
    assert "/storage/v1/object/sign/flamee-media/memories/" in payload["url"]
    assert "/storage/v1/object/sign/flamee-media/memories/" in payload["thumbnail_url"]
    assert payload["width"] == payload["height"] == 1
    assert payload["mime_type"] == "image/jpeg"
    assert payload["size_bytes"] > 0
    stored = next(iter(fake_db.table("memory_images")._data.values()))
    assert stored["url"] is None
    assert stored["thumbnail_url"] is None
    assert stored["storage_path"].endswith("/original.jpg")
    assert stored["thumbnail_path"].endswith("/thumbnail.jpg")

    detail = client.get(
        f"/api/v1/memories/{memory_id}", headers=bob_headers
    ).json()["data"]
    assert len(detail["images"]) == 1


def test_image_delete_removes_from_detail(
    client: TestClient, alice_headers, seeded_couple, fake_db
):
    memory_id = _create_memory(client, alice_headers, title="Image test")
    image_id = _upload_image(client, alice_headers, memory_id)
    delete = client.delete(
        f"/api/v1/memories/{memory_id}/images/{image_id}",
        headers=alice_headers,
    )
    assert delete.status_code == 204
    assert fake_db.storage.buckets["flamee-media"].objects == {}
    after = client.get(
        f"/api/v1/memories/{memory_id}", headers=alice_headers
    ).json()["data"]
    assert after["images"] == []


def test_memory_delete_removes_all_private_image_objects(
    client: TestClient, alice_headers, seeded_couple, fake_db
):
    memory_id = _create_memory(client, alice_headers)
    _upload_image(client, alice_headers, memory_id)
    assert len(fake_db.storage.buckets["flamee-media"].objects) == 2
    response = client.delete(
        f"/api/v1/memories/{memory_id}", headers=alice_headers
    )
    assert response.status_code == 204
    assert fake_db.storage.buckets["flamee-media"].objects == {}
    assert fake_db.table("memory_images")._data == {}


def test_invalid_image_is_rejected_before_storage_write(
    client: TestClient, alice_headers, seeded_couple, fake_db
):
    memory_id = _create_memory(client, alice_headers)
    response = client.post(
        f"/api/v1/memories/{memory_id}/images",
        headers=alice_headers,
        files={"file": ("fake.jpg", io.BytesIO(b"not an image"), "image/jpeg")},
    )
    assert response.status_code == 400
    bucket = fake_db.storage.buckets["flamee-media"]
    assert bucket.upload_calls == []
    assert bucket.objects == {}


def test_failed_image_metadata_write_compensates_uploaded_objects(
    client: TestClient, alice_headers, seeded_couple, fake_db, monkeypatch
):
    memory_id = _create_memory(client, alice_headers)

    def fail_create(_self, **_fields):
        raise RuntimeError("database unavailable")

    monkeypatch.setattr(MemoryImageRepository, "create", fail_create)
    with pytest.raises(RuntimeError, match="database unavailable"):
        client.post(
            f"/api/v1/memories/{memory_id}/images",
            headers=alice_headers,
            files={"file": ("image.png", io.BytesIO(_TINY_PNG), "image/png")},
        )
    assert fake_db.storage.buckets["flamee-media"].objects == {}


def test_memory_list_fetches_image_metadata_once_for_the_page(
    client: TestClient, alice_headers, seeded_couple, fake_db
):
    first = _create_memory(client, alice_headers, title="First")
    second = _create_memory(client, alice_headers, title="Second")
    _upload_image(client, alice_headers, first)
    _upload_image(client, alice_headers, second)
    image_table = fake_db.table("memory_images")
    image_table.select_calls = 0
    bucket = fake_db.storage.buckets["flamee-media"]
    bucket.batch_sign_calls = []
    response = client.get("/api/v1/memories", headers=alice_headers)
    assert response.status_code == 200
    assert image_table.select_calls == 1
    assert len(bucket.batch_sign_calls) == 1
    assert all(item["thumbnail_url"] for item in response.json()["data"]["items"])


def test_feed_exposes_sharp_cover_and_signs_only_the_cover_not_the_album(
    client: TestClient, alice_headers, seeded_couple, fake_db
):
    memory_id = _create_memory(client, alice_headers)
    for _ in range(3):
        _upload_image(client, alice_headers, memory_id)
    bucket = fake_db.storage.buckets["flamee-media"]
    bucket.batch_sign_calls = []

    response = client.get("/api/v1/memories", headers=alice_headers)
    assert response.status_code == 200
    item = response.json()["data"]["items"][0]
    assert item["image_count"] == 3
    cover = item.get("cover_image")
    assert cover is not None
    assert "/original.jpg" in cover["url"]
    assert cover["thumbnail_url"] == item["thumbnail_url"]
    assert cover["width"] == cover["height"] == 1
    assert cover["url_expires_at"] is not None
    assert "storage_path" not in cover
    assert len(bucket.batch_sign_calls) == 1
    assert len(bucket.batch_sign_calls[0]) == 2

    # Detail still includes every image, authorized through the existing API.
    detail = client.get(f"/api/v1/memories/{memory_id}", headers=alice_headers)
    assert len(detail.json()["data"]["images"]) == 3


def test_filter_memories_by_category_and_year(
    client: TestClient, alice_headers, bob_headers, seeded_couple
):
    _seed_filter_data(client, alice_headers)
    by_trip = _list_memories(client, bob_headers, "category=trip")
    by_year = _list_memories(client, bob_headers, "year=2024")
    combined = _list_memories(
        client, bob_headers, "category=trip&year=2025"
    )
    assert by_trip["total"] == 2
    assert by_year["total"] == 2
    assert combined["total"] == 1
    assert combined["items"][0]["title"] == "Trip 2025"


def _seed_filter_data(client: TestClient, headers: dict) -> None:
    _create_memory(
        client, headers,
        title="Trip 2024", category="trip", memory_date="2024-07-01",
    )
    _create_memory(
        client, headers,
        title="Trip 2025", category="trip", memory_date="2025-08-15",
    )
    _create_memory(
        client, headers,
        title="Anniversary 2024", category="anniversary", memory_date="2024-12-20",
    )


def _list_memories(client: TestClient, headers: dict, query: str) -> dict:
    return client.get(
        f"/api/v1/memories?{query}", headers=headers
    ).json()["data"]


def _create_memory(
    client: TestClient,
    headers: dict,
    *,
    title: str = "Sample",
    category: str = "moment",
    memory_date: str = "2025-01-01",
    **extra: Any,
) -> str:
    payload: dict = {
        "title": title,
        "category": category,
        "memory_date": memory_date,
    }
    payload.update(extra)
    response = client.post("/api/v1/memories", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()["data"]["id"]


def _upload_image(client: TestClient, headers: dict, memory_id: str) -> str:
    response = client.post(
        f"/api/v1/memories/{memory_id}/images",
        headers=headers,
        files={"file": ("test.png", io.BytesIO(_TINY_PNG), "image/png")},
    )
    assert response.status_code == 201, response.text
    return response.json()["data"]["id"]
