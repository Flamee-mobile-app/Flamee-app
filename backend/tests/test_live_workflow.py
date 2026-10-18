"""Explicit opt-in only. Creates and RETAINS synthetic users/data on real Supabase.

FLAMEE_TEST_LIVE_WORKFLOW=1 authorizes writes and paid Gemini requests.
FLAMEE_TEST_GEMINI_MODEL overrides the model for this test server only.
Reports contain IDs/statuses, never passwords, keys, tokens or signed URLs.
"""
import io
import json
import os
from pathlib import Path
import secrets
import socket
import subprocess
import sys
import time
from datetime import datetime, timezone

import httpx
from PIL import Image
import pytest

pytestmark = [pytest.mark.live_workflow, pytest.mark.skipif(
    os.getenv("FLAMEE_TEST_LIVE_WORKFLOW") != "1", reason="Real writes require explicit opt-in")]


def test_real_user_workflow():
    from app.config import settings

    run_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S") + secrets.token_hex(3)
    report = {"run_id": run_id, "model": os.getenv("FLAMEE_TEST_GEMINI_MODEL", settings.gemini_model),
              "retained_data": {}, "checks": [], "completed": False}
    report_dir = Path(__file__).parent / "artifacts"
    report_dir.mkdir(exist_ok=True)
    report_path = report_dir / f"live-{run_id}.json"

    def save():
        report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    def check(label, condition):
        report["checks"].append({"check": label, "passed": bool(condition)})
        save()
        assert condition, label

    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        port = listener.getsockname()[1]
    env = dict(os.environ, FLAMEE_AI_PROVIDER="gemini", FLAMEE_GEMINI_MODEL=report["model"],
               FLAMEE_OPENAI_API_KEY="")
    process = subprocess.Popen(
        [sys.executable, "-B", "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(port)],
        cwd=Path(__file__).resolve().parents[1], env=env,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        with httpx.Client(base_url=f"http://127.0.0.1:{port}/api/v1", timeout=60) as api, httpx.Client(
            base_url=settings.supabase_url.rstrip("/") + "/rest/v1/", timeout=30,
            headers={"apikey": settings.supabase_service_key, "Authorization": f"Bearer {settings.supabase_service_key}"}
        ) as db:
            deadline = time.monotonic() + 20
            while True:
                try:
                    if api.get("/auth/me").status_code == 401:
                        break
                except httpx.RequestError:
                    pass
                check("server still running", process.poll() is None and time.monotonic() < deadline)
                time.sleep(.2)

            def call(label, method, path, code=200, token=None, **kwargs):
                headers = {"Authorization": f"Bearer {token}"} if token else {}
                response = api.request(method, path, headers=headers, **kwargs)
                check(f"{label}: HTTP {response.status_code} expected {code}", response.status_code == code)
                return response.json().get("data") if response.content else None

            def rows(table, **filters):
                response = db.get(table, params={"select": "*", **{k: f"eq.{v}" for k, v in filters.items()}})
                check(f"read persisted {table}", response.status_code == 200)
                return response.json()

            password = secrets.token_urlsafe(24) + "Aa1!"
            accounts = []
            for name in ("alice", "bob", "outsider"):
                email = f"flamee.e2e.{run_id}.{name}@example.com"
                data = call(f"register {name}", "POST", "/auth/register", 201,
                            json={"email": email, "password": password, "full_name": f"E2E {name} {run_id}"})
                accounts.append(data)
                report["retained_data"][name] = {"id": data["user"]["id"], "email": email}
                save()
            a, b, outsider = accounts
            ta, tb, tx = [x["access_token"] for x in accounts]
            uid = a["user"]["id"]
            call("wrong password rejected", "POST", "/auth/login", 401,
                 json={"email": a["user"]["email"], "password": "WrongPassword123!"})
            login = call("login", "POST", "/auth/login", json={"email": a["user"]["email"], "password": password})
            call("profile update", "PUT", "/users/me", token=ta,
                 json={"nickname": "E2E Alice", "timezone": "Asia/Ho_Chi_Minh"})
            check("profile persisted", rows("users", id=uid)[0]["nickname"] == "E2E Alice")
            picture = io.BytesIO()
            Image.new("RGB", (640, 480), (34, 130, 180)).save(picture, "PNG")
            avatar = call("avatar upload", "POST", "/auth/me/avatar", token=ta,
                          files={"file": ("synthetic.png", picture.getvalue(), "image/png")})
            stored = rows("users", id=uid)[0]
            check("avatar stores object path", bool(stored.get("avatar_storage_path")) and not stored.get("avatar_url"))
            invite = call("invite", "POST", "/couple/invite-code", 201, token=ta)
            couple = call("accept invite", "POST", "/couple/accept-invite", token=tb, json={"code": invite["code"]})
            report["retained_data"]["couple_id"] = couple["id"]
            save()
            check("both users paired in database", all(rows("users", id=x["user"]["id"])[0]["couple_id"] == couple["id"] for x in (a,b)))
            memory = call("create memory", "POST", "/memories", 201, token=ta,
                          json={"title": f"E2E synthetic memory {run_id}", "category": "moment", "memory_date": "2026-10-18"})
            mid = memory["id"]
            report["retained_data"]["memory_id"] = mid
            save()
            call("partner reads memory", "GET", f"/memories/{mid}", token=tb)
            denied = api.get(f"/memories/{mid}", headers={"Authorization": f"Bearer {tx}"})
            check("outsider cannot read memory", denied.status_code in (400,403,404))
            media = call("memory image upload", "POST", f"/memories/{mid}/images", 201, token=ta,
                         files={"file": ("synthetic.png", picture.getvalue(), "image/png")})
            report["retained_data"]["memory_image_id"] = media["id"]
            save()
            image_row = rows("memory_images", id=media["id"])[0]
            check("private media paths persisted, URLs ephemeral", bool(image_row["storage_path"]) and bool(image_row["thumbnail_path"]) and not image_row.get("url"))
            with httpx.Client(timeout=30) as download:
                downloaded = download.get(media["url"])
                check("signed image downloads as JPEG", downloaded.status_code == 200 and downloaded.content.startswith(b"\xff\xd8"))
                public = download.get(settings.supabase_url.rstrip("/") + "/storage/v1/object/public/flamee-media/" + image_row["storage_path"])
                check("anonymous public image denied", public.status_code in (400,403,404))
            call("update memory", "PUT", f"/memories/{mid}", token=tb, json={"is_pinned": True})
            check("memory update persisted", rows("memories", id=mid)[0]["is_pinned"])
            call("list memories", "GET", "/memories?limit=1&offset=0", token=tb)
            temp = call("create disposable memory", "POST", "/memories", 201, token=ta,
                        json={"title": f"E2E disposable {run_id}", "category": "moment", "memory_date": "2026-10-18"})
            call("delete disposable memory", "DELETE", f"/memories/{temp['id']}", 204, token=ta)
            check("disposable memory removed", not rows("memories", id=temp["id"]))
            mood = call("shared mood", "POST", "/moods", 201, token=ta,
                        json={"mood": "happy", "mood_score": 4, "share_level": "all", "note": "Synthetic test: enjoyed a quiet walk today."})
            report["retained_data"]["shared_mood_id"] = mood["id"]
            check("mood persisted", bool(rows("moods", id=mood["id"])))
            deadline = time.monotonic() + 45
            nudge = None
            while time.monotonic() < deadline:
                nudge = call("poll nudge", "GET", "/nudges/active", token=tb)
                if nudge:
                    break
                time.sleep(1)
            check("nudge generated and stored", bool(nudge))
            report["retained_data"]["nudge_id"] = nudge["id"]
            report["ai_source"] = nudge["source"]
            report["ai_latency_ms"] = nudge.get("latency_ms")
            save()
            call("rate nudge", "POST", f"/nudges/{nudge['id']}/rate", token=tb, json={"rating": "thumbs_up"})
            call("complete nudge", "POST", f"/nudges/{nudge['id']}/action", token=tb, json={"action": "completed"})
            moment = call("send tiny moment", "POST", "/tiny-moments", 201, token=tb,
                          json={"moment_type": "text", "content": f"Synthetic hello {run_id}", "nudge_id": nudge["id"]})
            report["retained_data"]["tiny_moment_id"] = moment["id"]
            check("tiny moment persisted", bool(rows("tiny_moments", id=moment["id"])))
            moments = call("partner receives tiny moment", "GET", "/tiny-moments", token=ta)
            check("shared moment visible", any(m["id"] == moment["id"] for m in moments))
            private = call("private mood", "POST", "/moods", 201, token=ta,
                           json={"mood": "calm", "share_level": "private", "note": "E2E private sentinel"})
            partner = call("partner mood privacy", "GET", "/moods/partner/latest", token=tb)
            check("private mood hidden from partner", partner["latest_mood"]["id"] != private["id"] and "E2E private sentinel" not in json.dumps(partner))
            limited = call("mood-only check-in", "POST", "/moods", 201, token=ta,
                           json={"mood": "calm", "share_level": "mood_only", "note": "E2E hidden note", "reasons": ["E2E hidden reason"]})
            partner = call("mood-only partner view", "GET", "/moods/partner/latest", token=tb)
            check("mood-only hides note and reasons", partner["latest_mood"]["id"] == limited["id"] and partner["latest_mood"]["note"] is None and not partner["latest_mood"]["reasons"])
            rotated = call("rotate refresh token", "POST", "/auth/refresh", json={"refresh_token": login["refresh_token"]})
            call("old access revoked", "GET", "/auth/me", 401, token=login["access_token"])
            call("refresh replay rejected", "POST", "/auth/refresh", 401, json={"refresh_token": login["refresh_token"]})
            call("new access works", "GET", "/auth/me", token=rotated["access_token"])
            call("logout", "POST", "/auth/logout", token=rotated["access_token"])
            call("logged out access rejected", "GET", "/auth/me", 401, token=rotated["access_token"])
            new_password = secrets.token_urlsafe(24) + "Aa1!"
            call("change own password", "POST", "/auth/change-password", token=tx,
                 json={"current_password": password, "new_password": new_password})
            call("password change revokes session", "GET", "/auth/me", 401, token=tx)
            call("old password rejected", "POST", "/auth/login", 401,
                 json={"email": outsider["user"]["email"], "password": password})
            changed = call("new password works", "POST", "/auth/login",
                           json={"email": outsider["user"]["email"], "password": new_password})
            call("close changed password session", "POST", "/auth/logout", token=changed["access_token"])
            for account in (a, b):
                call("close test session", "POST", "/auth/logout", token=account["access_token"])
            report["completed"] = True
            save()
            check("Gemini generated nudge (no template fallback)", nudge["source"] == "ai_agent")
    finally:
        save()
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=5)


def test_live_gemini_json(monkeypatch):
    from app.config import settings
    from app.ai.gemini_provider import GeminiProvider
    model = os.getenv("FLAMEE_TEST_GEMINI_MODEL", settings.gemini_model)
    monkeypatch.setattr(settings, "gemini_model", model)
    try:
        result = GeminiProvider().chat_sync(system="Return JSON only.",
            user='Synthetic API test: return {"ok":true}.', json_mode=True)
    except httpx.HTTPStatusError as exc:
        pytest.fail(f"Gemini {model}: HTTP {exc.response.status_code}", pytrace=False)
    assert json.loads(result) == {"ok": True}
