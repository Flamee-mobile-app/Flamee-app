from __future__ import annotations

import base64
import io

from fastapi.testclient import TestClient
import pytest

from app.repositories.user_repo import UserRepository


_TINY_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
)


def test_register_success(client: TestClient):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "new@example.com",
            "password": "Secret123",
            "full_name": "New User",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert data["user"]["email"] == "new@example.com"
    assert data["user"]["full_name"] == "New User"
    assert isinstance(data["access_token"], str) and data["access_token"]


def test_register_duplicate_email_returns_409(client: TestClient):
    payload = {
        "email": "dup@example.com",
        "password": "Secret123",
        "full_name": "Dup",
    }
    first = client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201
    second = client.post("/api/v1/auth/register", json=payload)
    assert second.status_code == 409
    assert second.json()["success"] is False


def test_login_wrong_password_returns_401(client: TestClient):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "login@example.com",
            "password": "Secret123",
            "full_name": "Login User",
        },
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "WrongPass"},
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"


def test_login_ok(client: TestClient):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "ok@example.com",
            "password": "Secret123",
            "full_name": "OK User",
        },
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "ok@example.com", "password": "Secret123"},
    )
    assert response.status_code == 200
    assert response.json()["data"]["access_token"]


def test_me_without_token_returns_401(client: TestClient):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_me_with_token_returns_200(client: TestClient, alice_headers):
    response = client.get("/api/v1/auth/me", headers=alice_headers)
    assert response.status_code == 200
    body = response.json()["data"]
    assert body["email"] == "alice@example.com"


def test_change_password_wrong_current_returns_401(
    client: TestClient, alice_headers
):
    response = client.post(
        "/api/v1/auth/change-password",
        json={
            "current_password": "WrongCurrent",
            "new_password": "NewSecret123",
        },
        headers=alice_headers,
    )
    assert response.status_code == 401


def test_change_password_ok(client: TestClient, alice_headers):
    response = client.post(
        "/api/v1/auth/change-password",
        json={
            "current_password": "Secret123",
            "new_password": "NewSecret123",
        },
        headers=alice_headers,
    )
    assert response.status_code == 200
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "alice@example.com", "password": "NewSecret123"},
    )
    assert login.status_code == 200


def test_avatar_upload_is_private_signed_and_delete_cleans_storage(
    client: TestClient, alice_headers, fake_db
):
    upload = client.post(
        "/api/v1/auth/me/avatar",
        headers=alice_headers,
        files={"file": ("avatar.png", io.BytesIO(_TINY_PNG), "image/png")},
    )
    assert upload.status_code == 200, upload.text
    avatar_url = upload.json()["data"]["avatar_url"]
    assert "/storage/v1/object/sign/flamee-media/avatars/" in avatar_url
    me = client.get("/api/v1/auth/me", headers=alice_headers)
    assert me.json()["data"]["avatar_url"].split("?", 1)[0] == avatar_url.split("?", 1)[0]
    users_alias = client.get("/api/v1/users/me", headers=alice_headers)
    assert users_alias.json()["data"]["avatar_url"].split("?", 1)[0] == avatar_url.split("?", 1)[0]
    user = next(iter(fake_db.table("users")._data.values()))
    assert user["avatar_url"] is None
    assert user["avatar_storage_path"].endswith("/avatar.jpg")
    assert len(fake_db.storage.buckets["flamee-media"].objects) == 1

    removed = client.delete("/api/v1/auth/me/avatar", headers=alice_headers)
    assert removed.status_code == 200
    assert removed.json()["data"]["avatar_url"] is None
    assert fake_db.storage.buckets["flamee-media"].objects == {}


def test_replacing_avatar_removes_the_previous_object(
    client: TestClient, alice_headers, fake_db
):
    for _ in range(2):
        response = client.post(
            "/api/v1/auth/me/avatar",
            headers=alice_headers,
            files={"file": ("avatar.png", io.BytesIO(_TINY_PNG), "image/png")},
        )
        assert response.status_code == 200
    bucket = fake_db.storage.buckets["flamee-media"]
    assert len(bucket.objects) == 1
    assert len(bucket.remove_calls) == 1


def test_text_profile_cannot_assign_an_arbitrary_avatar_url(
    client: TestClient, alice_headers
):
    response = client.put(
        "/api/v1/auth/me",
        headers=alice_headers,
        json={"avatar_url": "https://attacker.example/avatar.jpg"},
    )
    assert response.status_code == 422


def test_invalid_avatar_is_rejected_before_storage_write(
    client: TestClient, alice_headers, fake_db
):
    response = client.post(
        "/api/v1/auth/me/avatar",
        headers=alice_headers,
        files={"file": ("fake.png", io.BytesIO(b"not an image"), "image/png")},
    )
    assert response.status_code == 400
    bucket = fake_db.storage.buckets["flamee-media"]
    assert bucket.upload_calls == []


def test_failed_avatar_database_write_compensates_new_object(
    client: TestClient, alice_headers, fake_db, monkeypatch
):
    def fail_update(_self, _user_id, **_patch):
        raise RuntimeError("database unavailable")

    monkeypatch.setattr(UserRepository, "update", fail_update)
    with pytest.raises(RuntimeError, match="database unavailable"):
        client.post(
            "/api/v1/auth/me/avatar",
            headers=alice_headers,
            files={"file": ("avatar.png", io.BytesIO(_TINY_PNG), "image/png")},
        )
    assert fake_db.storage.buckets["flamee-media"].objects == {}


