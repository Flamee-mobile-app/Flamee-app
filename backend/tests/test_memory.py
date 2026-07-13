from __future__ import annotations

import io
from typing import Any

from fastapi.testclient import TestClient

_TINY_PNG = (
    b"\x89PNG\r\n\x1a\n"
    b"\x00\x00\x00\rIHDR"
    b"\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
    b"\x00\x00\x00\rIDATx\x9cc\xf8\xff\xff\xff?\x00\x05\xfe\x02\xfe\xa3\x9c\xea\xfa"
    b"\x00\x00\x00\x00IEND\xaeB`\x82"
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
    client: TestClient, alice_headers, bob_headers, seeded_couple
):
    memory_id = _create_memory(client, alice_headers, title="Image test")
    upload = client.post(
        f"/api/v1/memories/{memory_id}/images",
        headers=alice_headers,
        files={"file": ("test.png", io.BytesIO(_TINY_PNG), "image/png")},
    )
    assert upload.status_code == 201, upload.text
    assert upload.json()["data"]["url"].startswith("data:image/png;base64,")

    detail = client.get(
        f"/api/v1/memories/{memory_id}", headers=bob_headers
    ).json()["data"]
    assert len(detail["images"]) == 1


def test_image_delete_removes_from_detail(
    client: TestClient, alice_headers, seeded_couple
):
    memory_id = _create_memory(client, alice_headers, title="Image test")
    image_id = _upload_image(client, alice_headers, memory_id)
    delete = client.delete(
        f"/api/v1/memories/{memory_id}/images/{image_id}",
        headers=alice_headers,
    )
    assert delete.status_code == 204
    after = client.get(
        f"/api/v1/memories/{memory_id}", headers=alice_headers
    ).json()["data"]
    assert after["images"] == []


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