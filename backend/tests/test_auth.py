from __future__ import annotations

from fastapi.testclient import TestClient


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


def test_forgot_password_returns_mock_otp(client: TestClient):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "otp@example.com",
            "password": "Secret123",
            "full_name": "OTP User",
        },
    )
    response = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "otp@example.com"},
    )
    assert response.status_code == 200
    body = response.json()["data"]
    assert body["otp"].isdigit() and len(body["otp"]) >= 4
    assert isinstance(body["expires_in"], int)


def test_reset_password_with_correct_otp(client: TestClient):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "reset@example.com",
            "password": "Secret123",
            "full_name": "Reset User",
        },
    )
    otp = _request_otp(client, "reset@example.com")
    reset = client.post(
        "/api/v1/auth/reset-password",
        json={
            "email": "reset@example.com",
            "otp": otp,
            "new_password": "AnotherSecret123",
        },
    )
    assert reset.status_code == 200
    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "reset@example.com",
            "password": "AnotherSecret123",
        },
    )
    assert login.status_code == 200


def _request_otp(client: TestClient, email: str) -> str:
    forgot = client.post(
        "/api/v1/auth/forgot-password", json={"email": email}
    )
    return forgot.json()["data"]["otp"]