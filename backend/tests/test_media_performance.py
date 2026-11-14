from __future__ import annotations

from app.repositories.memory_repo import MemoryRepository
from app.services.avatar_service import AvatarService
from fastapi import UploadFile
from PIL import Image
import io


def test_memory_count_requests_no_response_rows(fake_db, monkeypatch):
    table = fake_db.table("memories")
    table._data = {str(i): {"id": str(i), "couple_id": "pair", "memory_date": "2026-01-01"} for i in range(5)}
    original = table.select
    requests = []

    def select(cols="*", count=None, head=False):
        requests.append(head)
        return original(cols, count=count, head=head)

    monkeypatch.setattr(table, "select", select)
    assert MemoryRepository(fake_db).count_by_couple("pair") == 5
    assert requests == [True]


def test_create_does_not_reread_its_acknowledged_record(client, alice_headers, seeded_couple, monkeypatch):
    reads = []
    original = MemoryRepository.get

    def get(self, record_id):
        reads.append(record_id)
        return original(self, record_id)

    monkeypatch.setattr(MemoryRepository, "get", get)
    response = client.post("/api/v1/memories", headers={**alice_headers, "Idempotency-Key": "fast-create"}, json={"title": "A day", "category": "moment", "memory_date": "2026-10-19"})
    assert response.status_code == 201
    assert response.json()["data"]["images"] == []
    assert len(reads) == 1


def test_avatar_cleanup_is_scheduled_only_after_the_new_avatar_is_committed(client, alice_headers, fake_db):
    user = client.get("/api/v1/auth/me", headers=alice_headers).json()["data"]
    stored = fake_db.table("users")._data[user["id"]]
    old_path = f"avatars/{user['id']}/old.jpg"
    stored["avatar_storage_path"] = old_path
    bucket = fake_db.storage.from_("flamee-media")
    bucket.objects[old_path] = b"old"
    content = io.BytesIO()
    Image.new("RGB", (20, 20), "red").save(content, format="JPEG")
    content.seek(0)
    tasks = []

    def schedule(task, path):
        assert stored["avatar_storage_path"] != old_path
        assert stored["avatar_storage_path"] in bucket.objects
        tasks.append((task, path))

    result = AvatarService(fake_db).upload(user["id"], UploadFile(file=content, filename="avatar.jpg"), schedule_cleanup=schedule)
    assert result.avatar_url
    assert old_path in bucket.objects
    assert len(tasks) == 1
    task, path = tasks[0]
    task(path)
    assert old_path not in bucket.objects


def test_feed_signs_its_covers_and_author_avatars_in_one_batch(client, alice_headers, seeded_couple, fake_db):
    content = io.BytesIO()
    Image.new("RGB", (20, 20), "red").save(content, format="JPEG")
    photo = content.getvalue()
    assert client.post("/api/v1/auth/me/avatar", headers=alice_headers, files={"file": ("a.jpg", photo, "image/jpeg")}).status_code == 200
    memory = client.post("/api/v1/memories", headers=alice_headers, json={"title": "A day", "category": "moment", "memory_date": "2026-10-19"}).json()["data"]
    assert client.post(f"/api/v1/memories/{memory['id']}/images", headers=alice_headers, files={"file": ("a.jpg", photo, "image/jpeg")}).status_code == 201
    bucket = fake_db.storage.from_("flamee-media")
    bucket.batch_sign_calls = []
    response = client.get("/api/v1/memories", headers=alice_headers)
    assert response.status_code == 200
    item = response.json()["data"]["items"][0]
    assert item["author"]["avatar_url"]
    assert item["cover_image"]["url"]
    assert len(bucket.batch_sign_calls) == 1
    assert len(bucket.batch_sign_calls[0]) == 3
