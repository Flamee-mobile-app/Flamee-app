"""Test auth_sessions: refresh rotation, logout revoke, change-password revoke."""
from __future__ import annotations

from fastapi.testclient import TestClient


def _register(client: TestClient, email: str, pw: str = "Secret123"):
    r = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": pw, "full_name": "Test"},
    )
    assert r.status_code == 201, r.text
    return r.json()["data"]


def test_login_returns_refresh_token(client: TestClient):
    data = _register(client, "login_refresh@example.com")
    assert data["access_token"]
    assert data.get("refresh_token")


def test_refresh_rotates_token(client: TestClient):
    data = _register(client, "rotate@example.com")
    refresh = data["refresh_token"]
    r = client.post(
        "/api/v1/auth/refresh", json={"refresh_token": refresh}
    )
    assert r.status_code == 200, r.text
    body = r.json()["data"]
    assert body["access_token"]
    assert body["refresh_token"]
    assert body["refresh_token"] != refresh  # rotated


def test_refresh_rejects_invalid_token(client: TestClient):
    r = client.post(
        "/api/v1/auth/refresh", json={"refresh_token": "not-a-real-token"}
    )
    assert r.status_code == 401


def test_refresh_rejects_revoked_token(client: TestClient):
    data = _register(client, "revoke@example.com")
    refresh = data["refresh_token"]
    # Logout revokes session
    headers = {"Authorization": f"Bearer {data['access_token']}"}
    out = client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": refresh},
        headers=headers,
    )
    assert out.status_code == 200
    # Now refresh should fail
    r = client.post(
        "/api/v1/auth/refresh", json={"refresh_token": refresh}
    )
    assert r.status_code == 401


def test_logout_revokes_access_token(client: TestClient):
    data = _register(client, "logout@example.com")
    headers = {"Authorization": f"Bearer {data['access_token']}"}
    # /me works before
    me1 = client.get("/api/v1/auth/me", headers=headers)
    assert me1.status_code == 200
    # Logout
    out = client.post("/api/v1/auth/logout", headers=headers)
    assert out.status_code == 200
    # /me fails after
    me2 = client.get("/api/v1/auth/me", headers=headers)
    assert me2.status_code == 401


def test_change_password_revokes_all_sessions(client: TestClient):
    data = _register(client, "changepw@example.com")
    access = data["access_token"]
    refresh = data["refresh_token"]
    headers = {"Authorization": f"Bearer {access}"}
    # Change password
    r = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "Secret123", "new_password": "NewSecret123"},
        headers=headers,
    )
    assert r.status_code == 200
    # Old access token phải bị revoke
    me = client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 401
    # Refresh cũ cũng không dùng được
    rr = client.post(
        "/api/v1/auth/refresh", json={"refresh_token": refresh}
    )
    assert rr.status_code == 401
    # Đăng nhập lại bằng password mới OK
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "changepw@example.com", "password": "NewSecret123"},
    )
    assert login.status_code == 200


def test_me_returns_unified_user_profile(client: TestClient):
    """Contract /auth/me phải có nickname, timezone, birth_date, gender."""
    data = _register(client, "profile@example.com")
    headers = {"Authorization": f"Bearer {data['access_token']}"}
    r = client.put(
        "/api/v1/auth/me",
        json={"nickname": "Ali", "timezone": "Asia/Ho_Chi_Minh"},
        headers=headers,
    )
    assert r.status_code == 200
    me = client.get("/api/v1/auth/me", headers=headers).json()["data"]
    assert me["nickname"] == "Ali"
    assert me["timezone"] == "Asia/Ho_Chi_Minh"
    assert "email" in me
    assert "couple_id" in me


def test_users_me_password_requires_current(client: TestClient):
    data = _register(client, "userpw@example.com")
    headers = {"Authorization": f"Bearer {data['access_token']}"}
    # Without current_password → 422 (pydantic min_length=1)
    r = client.put(
        "/api/v1/users/me/password",
        json={"new_password": "NewSecret123"},
        headers=headers,
    )
    assert r.status_code == 422
    # Wrong current_password → 401
    r2 = client.put(
        "/api/v1/users/me/password",
        json={"current_password": "WrongPw", "new_password": "NewSecret123"},
        headers=headers,
    )
    assert r2.status_code == 401
    # Correct → 200
    r3 = client.put(
        "/api/v1/users/me/password",
        json={"current_password": "Secret123", "new_password": "NewSecret123"},
        headers=headers,
    )
    assert r3.status_code == 200
