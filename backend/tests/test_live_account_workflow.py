"""Opt-in account/couple smoke on configured development Supabase.

FLAMEE_TEST_LIVE_ACCOUNT=1 permits exactly this test to create and retain two
synthetic accounts and one couple. Uploads then removes one test avatar.
No AI requests, migrations, or deletion of pre-existing users/data.
"""
from __future__ import annotations

import io
import os
from pathlib import Path
import secrets
import socket
import subprocess
import sys
import time

import httpx
from PIL import Image
import pytest

pytestmark = [pytest.mark.live_workflow, pytest.mark.skipif(
    os.getenv("FLAMEE_TEST_LIVE_ACCOUNT") != "1", reason="Real account writes need explicit opt-in")]


def test_development_account_workflow():
    run_id = "account-" + secrets.token_hex(6)
    password = secrets.token_urlsafe(24) + "Aa1!"
    new_password = secrets.token_urlsafe(24) + "Bb2!"
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        port = listener.getsockname()[1]
    process = subprocess.Popen(
        [sys.executable, "-B", "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(port)],
        cwd=Path(__file__).resolve().parents[1], env=dict(os.environ),
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        **({"creationflags": subprocess.CREATE_NO_WINDOW} if os.name == "nt" else {}),
    )
    checks: list[str] = []
    accounts: list[dict] = []
    try:
        with httpx.Client(base_url=f"http://127.0.0.1:{port}/api/v1", timeout=30) as api:
            deadline = time.monotonic() + 25
            while True:
                try:
                    if api.get("/auth/me").status_code == 401:
                        break
                except httpx.RequestError:
                    pass
                if process.poll() is not None or time.monotonic() >= deadline:
                    raise AssertionError("Isolated test API did not become ready; no account requests submitted")
                time.sleep(0.1)

            def call(label: str, method: str, path: str, *, expected=200, token=None, **kwargs):
                response = api.request(method, path, headers={"Authorization": f"Bearer {token}"} if token else {}, **kwargs)
                if response.status_code != expected:
                    raise AssertionError(f"{label}: HTTP {response.status_code}, expected {expected}")
                checks.append(label)
                if expected >= 400:
                    return None
                payload = response.json()
                if payload.get("success") is not True:
                    raise AssertionError(f"{label}: invalid response envelope")
                return payload.get("data")

            for suffix in ("a", "b"):
                accounts.append(call(f"register {suffix}", "POST", "/auth/register", expected=201,
                                     json={"email": f"{run_id}-{suffix}@example.com", "password": password,
                                           "full_name": f"E2E {run_id} {suffix}"}))
            alice, bob = accounts
            access = alice["access_token"]
            profile = call("read profile", "GET", "/auth/me", token=access)
            assert profile["id"] == alice["user"]["id"]
            profile = call("update profile", "PUT", "/auth/me", token=access,
                           json={"full_name": f"E2E {run_id} A", "username": "E2E"})
            assert profile["username"] == "E2E"

            picture = io.BytesIO()
            Image.new("RGB", (128, 128), color=(255, 220, 190)).save(picture, format="PNG")
            profile = call("upload test avatar", "POST", "/auth/me/avatar", token=access,
                           files={"file": ("e2e-avatar.png", picture.getvalue(), "image/png")})
            assert bool(profile["avatar_url"])
            profile = call("remove owned test avatar", "DELETE", "/auth/me/avatar", token=access)
            assert profile["avatar_url"] is None

            invite = call("create invite", "POST", "/couple/invite-code", token=access, expected=201, json={})
            call("preview invite", "POST", "/couple/validate-invite", token=bob["access_token"], json={"code": invite["code"]})
            couple = call("accept invite", "POST", "/couple/accept-invite", token=bob["access_token"], json={"code": invite["code"]})
            assert couple["status"] == "active"
            for index, account in enumerate(accounts):
                connected = call(f"read couple {index}", "GET", "/couple", token=account["access_token"])
                assert connected["id"] == couple["id"]

            call("wrong password validation", "POST", "/auth/change-password", token=access, expected=400,
                 json={"current_password": "not-the-current-password", "new_password": new_password})
            call("session preserved after validation", "GET", "/auth/me", token=access)
            changed = call("change password", "POST", "/auth/change-password", token=access,
                           json={"current_password": password, "new_password": new_password})
            assert changed["updated"] is True
            call("access revoked after change", "GET", "/auth/me", token=access, expected=401)
            call("refresh revoked after change", "POST", "/auth/refresh", expected=401,
                 json={"refresh_token": alice["refresh_token"]})
            current = call("login with changed password", "POST", "/auth/login",
                           json={"email": alice["user"]["email"], "password": new_password})
            ended = call("server logout", "POST", "/auth/logout", token=current["access_token"])
            assert ended["logged_out"] is True
            call("access revoked after logout", "GET", "/auth/me", token=current["access_token"], expected=401)
            call("refresh revoked after logout", "POST", "/auth/refresh", expected=401,
                 json={"refresh_token": current["refresh_token"]})
            call("partner session remains valid", "GET", "/auth/me", token=bob["access_token"])
            call("end partner test session", "POST", "/auth/logout", token=bob["access_token"])
    finally:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=10)
        # IDs and completed check labels only. Never print passwords, tokens or URLs.
        print({"run_id": run_id, "retained_account_ids": [item["user"]["id"] for item in accounts], "checks": checks})
