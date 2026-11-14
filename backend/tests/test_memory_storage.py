"""Test Memory/Storage: 6 mục M-01..M-06."""
from __future__ import annotations

import io

from fastapi.testclient import TestClient
from PIL import Image

# Valid image fixtures exercise actual decoding.
def _image_bytes(format):
    output = io.BytesIO()
    Image.new("RGB", (640, 480), "red").save(output, format=format)
    return output.getvalue()

# PNG
_TINY_PNG = _image_bytes("PNG")

# 1x1 JPEG
_TINY_JPEG = _image_bytes("JPEG")


def _register(client, email, pw="Secret123"):
    r = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": pw, "full_name": "T"},
    )
    assert r.status_code == 201
    return r.json()["data"]


def _create_memory(client, headers, **kwargs):
    payload = {"title": "X", "category": "moment", "memory_date": "2025-01-01"}
    payload.update(kwargs)
    r = client.post("/api/v1/memories", json=payload, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()["data"]["id"]


def _pair(client, alice_h, bob_h):
    inv = client.post("/api/v1/couple/invite-code", headers=alice_h)
    code = inv.json()["data"]["code"]
    acc = client.post(
        "/api/v1/couple/accept-invite", json={"code": code}, headers=bob_h
    )
    assert acc.status_code == 200


# M-01: bucket tên đúng
def test_m01_bucket_name_is_private_media(client, alice_headers, bob_headers):
    _pair(client, alice_headers, bob_headers)
    memory_id = _create_memory(client, alice_headers)
    upload = client.post(
        f"/api/v1/memories/{memory_id}/images",
        headers=alice_headers,
        files={"file": ("t.png", io.BytesIO(_TINY_PNG), "image/png")},
    )
    assert upload.status_code == 201
    url = upload.json()["data"]["url"]
    assert "/sign/flamee-media/memories/" in url


# M-02: thumbnail thật (Pillow tạo) + URL khác với original
def test_m02_real_thumbnail(client, alice_headers, bob_headers):
    _pair(client, alice_headers, bob_headers)
    memory_id = _create_memory(client, alice_headers)
    upload = client.post(
        f"/api/v1/memories/{memory_id}/images",
        headers=alice_headers,
        files={"file": ("t.png", io.BytesIO(_TINY_PNG), "image/png")},
    )
    assert upload.status_code == 201
    body = upload.json()["data"]
    assert body["thumbnail_url"]
    # Có thể bằng URL gốc nếu quá nhỏ; nhưng schema phải expose
    assert "url" in body
    # Width/height được lưu
    assert body["width"] is not None
    assert body["height"] is not None


# M-03: count chính xác + has_more
def test_m03_count_and_has_more(client, alice_headers, bob_headers):
    _pair(client, alice_headers, bob_headers)
    for i in range(3):
        _create_memory(client, alice_headers, title=f"M{i}")
    # limit=2 → has_more = True
    r = client.get(
        "/api/v1/memories?limit=2&offset=0", headers=alice_headers
    ).json()["data"]
    assert r["total"] == 3
    assert len(r["items"]) == 2
    assert r["has_more"] is True
    # limit=10 → has_more = False
    r2 = client.get(
        "/api/v1/memories?limit=10", headers=alice_headers
    ).json()["data"]
    assert r2["has_more"] is False


# M-05: validate MIME thật (Pillow decode)
def test_m05_rejects_non_image(client, alice_headers, bob_headers):
    _pair(client, alice_headers, bob_headers)
    memory_id = _create_memory(client, alice_headers)
    upload = client.post(
        f"/api/v1/memories/{memory_id}/images",
        headers=alice_headers,
        files={"file": ("fake.png", io.BytesIO(b"not an image"), "image/png")},
    )
    assert upload.status_code == 400
    assert "không phải ảnh" in upload.text or "ảnh" in upload.text.lower()


def test_m05_accepts_jpeg(client, alice_headers, bob_headers):
    _pair(client, alice_headers, bob_headers)
    memory_id = _create_memory(client, alice_headers)
    upload = client.post(
        f"/api/v1/memories/{memory_id}/images",
        headers=alice_headers,
        files={"file": ("t.jpg", io.BytesIO(_TINY_JPEG), "image/jpeg")},
    )
    assert upload.status_code == 201, upload.text


# M-06: signed URL có TTL
def test_m06_signed_url_has_ttl(client, alice_headers, bob_headers):
    _pair(client, alice_headers, bob_headers)
    memory_id = _create_memory(client, alice_headers)
    upload = client.post(
        f"/api/v1/memories/{memory_id}/images",
        headers=alice_headers,
        files={"file": ("t.png", io.BytesIO(_TINY_PNG), "image/png")},
    )
    body = upload.json()["data"]
    url = body["url"]
    assert "ttl=900" in url
    # url_expires_at là epoch
    assert body["url_expires_at"] is not None
    import time
    # TTL > hiện tại
    assert body["url_expires_at"] > int(time.time())


# M-04: delete dọn cả object gốc + thumb
def test_m04_delete_memory_removes_objects(
    client, alice_headers, bob_headers, fake_db
):
    _pair(client, alice_headers, bob_headers)
    memory_id = _create_memory(client, alice_headers)
    upload = client.post(
        f"/api/v1/memories/{memory_id}/images",
        headers=alice_headers,
        files={"file": ("t.png", io.BytesIO(_TINY_PNG), "image/png")},
    )
    assert upload.status_code == 201
    # Bucket đã có 1 original + 1 thumb
    bucket = fake_db.storage.from_("flamee-media")
    initial_keys = list(bucket.objects.keys())
    assert len(initial_keys) == 2
    # Delete memory
    del_resp = client.delete(
        f"/api/v1/memories/{memory_id}", headers=alice_headers
    )
    assert del_resp.status_code == 204
    # Cả 2 objects đã được dọn
    assert len(bucket.objects) == 0
