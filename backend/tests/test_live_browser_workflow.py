"""Opt-in: real development accounts, browser UI and API; never mocks responses.

Retains test accounts/couple/moods and a report without passwords/tokens.
Runs an isolated API with AI pointed to an unavailable local endpoint so the
real template fallback is exercised without paid provider calls.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import secrets
import socket
import subprocess
import sys
import time
from urllib.parse import urlsplit

import httpx
import pytest

pytestmark = [pytest.mark.live_workflow, pytest.mark.skipif(
    os.getenv("FLAMEE_TEST_LIVE_BROWSER") != "1", reason="Development UI/data writes are opt-in")]


def test_real_two_browser_couple_and_mood_workflow():
    from app.config import settings
    from playwright.sync_api import sync_playwright
    from websockets.sync.client import connect

    assert settings.debug, "This test only runs with development settings"
    root = Path(__file__).resolve().parents[2]
    run_id = "ui-" + secrets.token_hex(5)
    output = root / "docs/progress/2026-11-10-browser-e2e" / run_id
    output.mkdir(parents=True, exist_ok=False)
    report = {"run_id": run_id, "checks": [], "accounts": [], "errors": [], "ai_mode": "real template fallback; provider unavailable locally"}
    password = secrets.token_urlsafe(24) + "Aa1!"
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        port = listener.getsockname()[1]
    environment = dict(os.environ, FLAMEE_AI_PROVIDER="openai", FLAMEE_OPENAI_API_KEY="",
                       FLAMEE_GEMINI_API_KEY="", FLAMEE_OPENAI_BASE_URL="http://127.0.0.1:9",
                       FLAMEE_DEBUG="true")
    server_log = (output / 'server.log').open('w', encoding='utf-8')
    process = subprocess.Popen(
        [sys.executable, "-B", "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(port)],
        cwd=root / "backend", env=environment, stdout=server_log, stderr=subprocess.STDOUT,
        **({"creationflags": subprocess.CREATE_NO_WINDOW} if os.name == "nt" else {}),
    )
    api_root = f"http://127.0.0.1:{port}/api/v1"

    def checked(label):
        report["checks"].append(label)

    try:
        with httpx.Client(base_url=api_root, timeout=30) as api:
            deadline = time.monotonic() + 25
            while True:
                try:
                    if api.get("/auth/me").status_code == 401:
                        break
                except httpx.RequestError:
                    pass
                assert process.poll() is None and time.monotonic() < deadline, "Test API startup failed"
                time.sleep(0.1)

            def call(method, path, token=None, expected=200, **kwargs):
                response = api.request(method, path, headers={"Authorization": "Bearer " + token} if token else {}, **kwargs)
                assert response.status_code == expected, f"{method} {path}: HTTP {response.status_code}, expected {expected}"
                if expected >= 400 or expected == 204:
                    return None
                return response.json()["data"]

            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(headless=True)
                contexts = [browser.new_context(viewport={"width": 414, "height": 896}) for _ in range(2)]
                pages = [context.new_page() for context in contexts]

                def proxy(route):
                    # A real network proxy to the isolated FastAPI, not a fixture.
                    url = urlsplit(route.request.url)
                    response = route.fetch(url=api_root + url.path.removeprefix("/api/v1") + ("?" + url.query if url.query else ""), timeout=45000)
                    route.fulfill(response=response)

                accounts = []
                for index, page in enumerate(pages):
                    page.route("**/api/v1/**", proxy)
                    # Proxy the real websocket too: local DHCP changes must not
                    # redirect this isolated acceptance run to a stale LAN IP.
                    page.add_init_script('''
                        const OriginalWebSocket = window.WebSocket;
                        window.WebSocket = class extends OriginalWebSocket {
                            constructor(url, protocols) {
                                super(String(url).endsWith('/api/v1/ws') ? %s : url, protocols);
                            }
                        };
                    ''' % json.dumps(f'ws://127.0.0.1:{port}/api/v1/ws'))
                    page.on('response', lambda response: report.setdefault('failed_requests', []).append({'path': urlsplit(response.url).path, 'status': response.status}) if response.status >= 500 else None)
                    page.on("console", lambda message: report["errors"].append(message.text[:500]) if message.type == "error" else None)
                    page.goto("http://localhost:8081", wait_until="domcontentloaded", timeout=120000)
                    page.get_by_role("button", name="Đăng ký", exact=True).click(timeout=60000)
                    email = f"{run_id}-{index}@example.com"
                    page.locator("#register-fullName").fill(f"Flamee UI {index + 1}")
                    page.locator("#register-email").fill(email)
                    page.locator("#register-password").fill(password)
                    page.locator("#register-confirmPassword").fill(password)
                    with page.expect_response(lambda response: response.url.endswith("/auth/register") and response.request.method == "POST", timeout=45000) as registration:
                        page.get_by_role("button", name="Đăng ký", exact=True).click()
                    assert registration.value.status == 201, "UI registration failed"
                    account = registration.value.json()["data"]
                    accounts.append(account)
                    report["accounts"].append({"id": account["user"]["id"], "email": email})
                    # New accounts complete real server-backed onboarding first.
                    page.locator('#preferences-nickname').fill('Moon ' + run_id)
                    page.get_by_role('checkbox').first.check()
                    page.locator('#preferences-note').fill('Care private ' + run_id)
                    page.get_by_role('radio', name='Yêu xa', exact=True).click()
                    with page.expect_response(lambda response: response.url.endswith('/users/me/preferences') and response.request.method == 'PUT', timeout=45000) as preferences:
                        page.get_by_role('button', name='Lưu và tiếp tục', exact=True).click()
                    assert preferences.value.status == 200
                    persisted = call('GET', '/users/me/preferences', account['access_token'])
                    assert persisted['care_note'] == 'Care private ' + run_id
                    assert persisted['care_preferences'] == ['encouragement']
                    assert persisted['onboarding_completed_at']
                    checked(f'browser {index + 1} onboarding/preferences saved and re-read from development')
                    page.get_by_role("button", name="Tạo mã mời", exact=True).wait_for(timeout=30000)
                    checked(f"browser {index + 1} registration/session/invite chooser")

                a, b = accounts
                tokens = [account["access_token"] for account in accounts]
                # Waiting check-in must remain owned, not backfilled into a new couple.
                mood = {"draft_version": 2, "mood": "happy", "intensity": 4, "mood_score": 5,
                        "note": "Development UI check", "reasons": ["work", "study", "family", "friends"],
                        "custom_emotion_label": None, "mascot_sticker_id": "mascot-neutral", "sleep_hours": 6,
                        "attachments": [{"kind": "gif", "id": "happy"}], "timezone": "Asia/Ho_Chi_Minh",
                        "share_level": "private", "is_private": True}
                headers_a = {"Authorization": "Bearer " + tokens[0], "Idempotency-Key": run_id + "-waiting"}
                waiting = api.post("/moods", headers=headers_a, json=mood)
                assert waiting.status_code == 201, f"Waiting mood: HTTP {waiting.status_code}"
                checked("waiting mood v2 persisted on development")

                with pages[0].expect_response(lambda response: response.url.endswith("/couple/invite-code") and response.request.method == "POST", timeout=45000) as invite_response:
                    pages[0].get_by_role("button", name="Tạo mã mời", exact=True).click()
                assert invite_response.value.status == 201
                code = invite_response.value.json()["data"]["code"]
                pages[1].get_by_role("button", name="Nhập mã mời", exact=True).click()
                pages[1].get_by_role("textbox").fill(code)
                with pages[1].expect_response(lambda response: response.url.endswith("/couple/accept-invite"), timeout=45000) as accepted:
                    pages[1].get_by_role("button", name="Kết nối", exact=True).click()
                assert accepted.value.status == 200
                couple_a = call("GET", "/couple", tokens[0])
                couple_b = call("GET", "/couple", tokens[1])
                assert couple_a["id"] == couple_b["id"]
                report["couple_id"] = couple_a["id"]
                checked("invite create/validate/accept via UI; same couple on both APIs")
                assert call("GET", "/moods/partner/latest", tokens[1])["latest_mood"] is None
                checked("waiting mood not shared after pairing")
                pages[0].screenshot(path=str(output / "a-paired.png"), full_page=True)
                pages[1].screenshot(path=str(output / "b-paired.png"), full_page=True)

                full = dict(mood, share_level="all", is_private=False)
                mood_headers = {"Authorization": "Bearer " + tokens[0], "Idempotency-Key": run_id + "-full"}
                first = api.post("/moods", headers=mood_headers, json=full)
                assert first.status_code == 201
                replay = api.post("/moods", headers=mood_headers, json=full)
                assert replay.status_code == 201 and replay.json()["data"]["id"] == first.json()["data"]["id"]
                assert api.post("/moods", headers=mood_headers, json=dict(full, note="Changed")).status_code == 409
                latest = call("GET", "/moods/partner/latest", tokens[1])["latest_mood"]
                assert latest["id"] == first.json()["data"]["id"] and latest["sleep_hours"] == 6
                assert len(latest["reasons"]) == 4 and latest["attachments"] == full["attachments"]
                checked("full mood round-trip/partner; retry same ID; changed payload409")

                for scope in ("mood_only", "private"):
                    response = api.post("/moods", headers={"Authorization": "Bearer " + tokens[0], "Idempotency-Key": run_id + "-" + scope}, json=dict(full, share_level=scope, is_private=scope == "private"))
                    assert response.status_code == 201
                    latest = call("GET", "/moods/partner/latest", tokens[1])["latest_mood"]
                    if scope == "mood_only":
                        assert latest["id"] == response.json()["data"]["id"]
                        assert latest["note"] is None and latest["reasons"] is None and latest["sleep_hours"] is None
                        assert latest["attachments"] == []
                    else:
                        assert latest["id"] != response.json()["data"]["id"]
                    checked(scope + " privacy verified on real API")

                assert len(call("GET", "/moods", tokens[0])) == 4
                checked("owner history retains four confirmed check-ins")
                nudge = call("GET", "/nudges/active", tokens[1])
                assert nudge is not None and nudge["source"] == "template"
                assert call('GET', '/nudges/' + nudge['id'], tokens[1])['id'] == nudge['id']
                call('GET', '/nudges/' + nudge['id'], tokens[0], expected=403)
                checked("real Nudge template fallback; no paid AI requests")

                # Navigate within the app so web in-memory sessions are preserved.
                for index, page in enumerate(pages):
                    page.get_by_role("button", name="Tiếp tục vào Trang chủ", exact=True).click(timeout=20000)
                    page.get_by_text("Dòng thời gian", exact=True).first.wait_for(timeout=20000)
                    page.screenshot(path=str(output / f"{index + 1}-home.png"), full_page=True)
                checked("both paired browser sessions reached Home")
                # Real UI post, observed by the partner's normal polling query.
                title = "UI memory " + run_id
                pages[0].get_by_test_id('home-add-memory').click()
                pages[0].locator("#memory-composer-text").fill(title)
                with connect(f'ws://127.0.0.1:{port}/api/v1/ws', open_timeout=10) as realtime:
                    realtime.send(json.dumps({'type': 'auth', 'access_token': tokens[1]}))
                    assert json.loads(realtime.recv(timeout=10)) == {'event': 'ready', 'data': {}}
                    with pages[0].expect_response(lambda response: response.url.endswith("/memories") and response.request.method == "POST", timeout=45000) as created:
                        pages[0].get_by_role("button", name="Đăng", exact=True).click()
                    event = json.loads(realtime.recv(timeout=10))
                    assert event['event'] == 'memory.created' and set(event['data']) == {'id'}
                    checked('real WebSocket authenticated and received only memory ID invalidation')
                assert created.value.status == 201
                memory = created.value.json()["data"]
                pages[1].get_by_text(title, exact=True).wait_for(timeout=20000)
                report["memory_id"] = memory["id"]
                checked("A posts memory through UI; B sees it through real API polling")
                for index, page in enumerate(pages):
                    page.screenshot(path=str(output / f"{index + 1}-memory-feed.png"), full_page=True)
                page = pages[0]
                page.get_by_role("tab", name="Hoạt động", exact=True).click()
                page.get_by_role("button", name="Flamee UI 1", exact=True).click()
                page.locator('button[role="radio"]:not([aria-label])').first.click()
                page.get_by_role("button", name="Tiếp tục", exact=True).click()
                page.get_by_role("checkbox").first.click()
                page.get_by_role("button", name="Tiếp tục", exact=True).click()
                page.get_by_role("slider").first.focus()
                page.get_by_role("slider").first.press("ArrowRight")
                page.get_by_role("button", name="Tiếp tục", exact=True).click()
                page.get_by_role("textbox").fill("UI private " + run_id)
                page.get_by_role("button", name="Chia sẻ", exact=True).click()
                page.get_by_role("radio", name="Tốt", exact=True).click()
                page.get_by_role("radio", name="Chỉ mình tôi", exact=True).click()
                with page.expect_response(lambda response: response.url.endswith("/moods") and response.request.method == "POST", timeout=45000) as ui_mood:
                    page.get_by_role("button", name="Lưu check-in", exact=True).click()
                assert ui_mood.value.status == 201
                assert ui_mood.value.json()["data"]["note"] == "UI private " + run_id
                assert ui_mood.value.json()["data"]["share_level"] == "private"
                checked("four-step UI check-in saved real private mood with score and acknowledgement")
                page.screenshot(path=str(output / "a-after-checkin.png"), full_page=True)
                page = pages[1]
                page.get_by_role('tab', name='Hoạt động', exact=True).click()
                page.get_by_role('button', name='Xem gợi ý', exact=True).click()
                with page.expect_response(lambda response: response.url.endswith('/rate'), timeout=45000) as rating:
                    page.get_by_role('button', name='Hữu ích', exact=True).click()
                assert rating.value.status == 200
                with page.expect_response(lambda response: response.url.endswith('/action'), timeout=45000) as snooze:
                    page.get_by_role('button', name='Nhắc lại sau 2 giờ', exact=True).click()
                assert snooze.value.status == 200
                snoozed = snooze.value.json()['data']
                assert snoozed['snooze_count'] == 1
                replay = call('POST', '/nudges/' + nudge['id'] + '/action', tokens[1], json={'action': 'snoozed', 'version': nudge['version']})
                assert replay['version'] == snoozed['version']
                with page.expect_response(lambda response: response.url.endswith('/action'), timeout=45000) as completion:
                    page.get_by_role('button', name='Tôi đã thực hiện', exact=True).click()
                assert completion.value.status == 200 and completion.value.json()['data']['status'] == 'completed'
                call('POST', '/nudges/' + nudge['id'] + '/action', tokens[1], expected=409, json={'action': 'dismissed', 'version': completion.value.json()['data']['version']})
                checked('real Nudge detail/rating/snooze retry/completion/conflict through UI and atomic database RPC')
                page.screenshot(path=str(output / 'b-nudge-completed.png'), full_page=True)
                # Two real shared check-ins race for one first suggestion to A.
                from concurrent.futures import ThreadPoolExecutor
                with ThreadPoolExecutor(max_workers=2) as workers:
                    def concurrent_checkin(index):
                        response = api.post('/moods', headers={'Authorization': 'Bearer ' + tokens[1],
                            'Idempotency-Key': run_id + '-concurrent-' + str(index)},
                            json={**full, 'note': 'Concurrent development ' + str(index)})
                        assert response.status_code == 201, 'Concurrent check-in HTTP ' + str(response.status_code)
                        return response.json()['data']
                    moods = list(workers.map(concurrent_checkin, range(2)))
                assert len({mood['id'] for mood in moods}) == 2
                headers = {'apikey': settings.supabase_service_key, 'Authorization': 'Bearer ' + settings.supabase_service_key}
                # HTTP201 acknowledges the mood; Nudge generation runs after
                # that response. Keep the API alive until its jobs commit.
                deadline = time.monotonic() + 15
                while True:
                    rows = httpx.get(settings.supabase_url.rstrip('/') + '/rest/v1/smart_nudges', headers=headers,
                        params={'select': 'id', 'couple_id': 'eq.' + report['couple_id'], 'receiver_id': 'eq.' + a['user']['id']}, timeout=20)
                    assert rows.status_code == 200
                    if rows.json() or time.monotonic() >= deadline:
                        break
                    pages[0].wait_for_timeout(250)
                assert len(rows.json()) == 1
                checked('two concurrent real check-ins create one receiver Nudge under database quota/cooldown guard')
                # Exercise the private composer with real acknowledgements.
                pages[0].get_by_role('tab', name='Hoạt động', exact=True).click()
                pages[1].go_back()
                page = pages[0]
                page.get_by_role('button', name='Tạo khoảnh khắc', exact=True).click()
                page.get_by_role('radio', name='Tin nhắn', exact=True).click()
                message = 'Private UI ' + run_id
                page.get_by_role('textbox').fill(message)
                with page.expect_response(lambda response: response.url.endswith('/tiny-moments') and response.request.method=='POST', timeout=45000) as sent:
                    page.get_by_role('button', name='Gửi khoảnh khắc', exact=True).click()
                assert sent.value.status==201
                pages[1].get_by_text(message, exact=True).wait_for(timeout=20000)
                pages[1].get_by_text(message, exact=True).scroll_into_view_if_needed()
                checked('A sends private text through composer; B sees server-confirmed Moment')
                pages[1].screenshot(path=str(output/'b-private-moments.png'), full_page=True)
                assert not report["errors"], "Browser console errors recorded; inspect report.json"
                report['complete'] = True
                browser.close()
    finally:
        if 'pages' in locals():
            for index, page in enumerate(pages):
                if not page.is_closed() and report.get('complete') is not True:
                    try:
                        page.screenshot(path=str(output / f'{index + 1}-failure.png'), full_page=True)
                    except Exception:
                        pass
        report.setdefault('complete', False)
        (output / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=5)
        server_log.close()
