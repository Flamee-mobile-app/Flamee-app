"""
Script test toàn diện các API AI của Flamee.
Luồng test:
  1. Register user mới (hoặc login nếu đã tồn tại)
  2. Tạo couple (invite-code -> accept-invite)
  3. Test Chat AI (POST /api/v1/chat) — kiểm tra LangGraph Agent
  4. Test Chat History (GET /api/v1/chat/history)
  5. Test Mood Check-in (POST /api/v1/moods) — trigger AI Mood Alert
  6. Test Get Moods (GET /api/v1/moods)
  7. Test Partner Mood Status (GET /api/v1/moods/partner/latest)
"""

import httpx
import json
import time
import sys
import traceback

BASE = "http://localhost:8000/api/v1"
TIMEOUT = 60  # AI calls can be slow

# ========== HELPERS ==========

def header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def pretty(label: str, resp):
    status_code = resp.status_code
    try:
        body = resp.json()
    except Exception:
        body = resp.text

    emoji = "✅" if 200 <= status_code < 300 else "❌"
    print(f"\n{'='*60}")
    print(f"{emoji} [{status_code}] {label}")
    print(f"{'='*60}")
    print(json.dumps(body, indent=2, ensure_ascii=False) if isinstance(body, (dict, list)) else body)
    return body


# ========== STEP 1: Register / Login ==========

def register_or_login(client: httpx.Client, email: str, password: str, name: str):
    """Try register, fallback to login if email exists."""
    print(f"\n{'#'*60}")
    print(f"# STEP 1: Register / Login ({email})")
    print(f"{'#'*60}")

    resp = client.post(f"{BASE}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": name,
    })

    if resp.status_code == 201:
        body = pretty("Register OK", resp)
        data = body["data"]
        return data["user"], data["access_token"]

    # Likely 409 conflict — user already exists
    print(f"  Register returned {resp.status_code}, trying login...")
    resp = client.post(f"{BASE}/auth/login", json={
        "email": email,
        "password": password,
    })
    body = pretty("Login OK", resp)
    if resp.status_code != 200:
        print("FATAL: Không thể đăng nhập!")
        sys.exit(1)
    data = body["data"]
    return data["user"], data["access_token"]


# ========== STEP 2: Couple Setup ==========

def setup_couple(client: httpx.Client, token1: str, token2: str):
    """Create invite code with user1, accept with user2. Return couple_id."""
    print(f"\n{'#'*60}")
    print(f"# STEP 2: Couple Setup")
    print(f"{'#'*60}")

    # Check if user1 already has couple
    resp = client.get(f"{BASE}/auth/me", headers=header(token1))
    me = resp.json()["data"]
    if me.get("couple_id"):
        print(f"  User 1 already in couple: {me['couple_id']}")
        return me["couple_id"]

    # Create invite code (đúng route: /couple/invite-code)
    resp = client.post(f"{BASE}/couple/invite-code", headers=header(token1))
    body = pretty("Create Invite Code", resp)
    if resp.status_code not in (200, 201):
        print("  WARN: Không tạo được invite code, bỏ qua couple setup.")
        return None
    code = body["data"]["code"]
    print(f"  Invite code: {code}")

    # Accept invite with user2 (đúng route: /couple/accept-invite)
    resp = client.post(f"{BASE}/couple/accept-invite", json={"code": code}, headers=header(token2))
    body = pretty("Accept Invite Code", resp)
    if resp.status_code not in (200, 201):
        print("  WARN: Không accept được invite code.")
        return None

    # Re-check user1 to get couple_id
    resp = client.get(f"{BASE}/auth/me", headers=header(token1))
    me = resp.json()["data"]
    couple_id = me.get("couple_id")
    print(f"  Couple ID: {couple_id}")
    return couple_id


# ========== STEP 3: Test Chat AI ==========

def test_chat_ai(client: httpx.Client, token: str):
    print(f"\n{'#'*60}")
    print(f"# STEP 3: Test Chat AI (LangGraph Agent)")
    print(f"{'#'*60}")

    messages = [
        "Xin chào! Mình là Nam, mình dị ứng với hải sản nhé.",
        "Người yêu mình tên Linh, cô ấy thích hoa hồng và sô-cô-la.",
        "Mình thấy mệt mỏi quá, công việc áp lực lắm, muốn bỏ việc luôn rồi...",
    ]

    for idx, msg in enumerate(messages, 1):
        print(f"\n--- Chat message {idx}: \"{msg[:60]}\" ---")
        try:
            resp = client.post(
                f"{BASE}/chat",
                json={"content": msg},
                headers=header(token),
                timeout=TIMEOUT,
            )
            body = pretty(f"Chat AI Response #{idx}", resp)
            if resp.status_code == 200 and isinstance(body, dict) and "data" in body:
                ai_text = body['data'].get('response', '(no response)')
                print(f"\n  🤖 AI: {ai_text[:300]}...")
        except Exception as e:
            print(f"  ❌ ERROR: {e}")
            traceback.print_exc()
        time.sleep(2)  # Rate limit


# ========== STEP 4: Test Chat History ==========

def test_chat_history(client: httpx.Client, token: str):
    print(f"\n{'#'*60}")
    print(f"# STEP 4: Test Chat History")
    print(f"{'#'*60}")

    resp = client.get(
        f"{BASE}/chat/history?limit=10",
        headers=header(token),
    )
    body = pretty("Chat History", resp)
    if resp.status_code == 200 and isinstance(body, dict) and "data" in body:
        messages = body["data"]
        print(f"\n  📜 Tổng tin nhắn: {len(messages)}")
        for m in messages[-6:]:  # Show last 6
            role = "👤 User" if m["sender_role"] == "user" else "🤖 AI"
            content_preview = m["content"][:100]
            print(f"    {role}: {content_preview}...")


# ========== STEP 5: Test Mood Check-in (AI Alert Trigger) ==========

def test_mood_checkin(client: httpx.Client, token: str):
    print(f"\n{'#'*60}")
    print(f"# STEP 5: Test Mood Check-in (trigger AI Alert)")
    print(f"{'#'*60}")

    # Gửi 3 cảm xúc tiêu cực liên tiếp để trigger AI alert
    negative_moods = [
        {"mood": "sad", "intensity": 7, "note": "Mình cãi nhau với sếp, rất buồn", "is_private": False},
        {"mood": "stressed", "intensity": 8, "note": "Deadline quá gấp, không kịp rồi", "is_private": False},
        {"mood": "angry", "intensity": 9, "note": "Đồng nghiệp đổ lỗi cho mình, tức muốn nổ tung", "is_private": False},
    ]

    for idx, mood_data in enumerate(negative_moods, 1):
        print(f"\n--- Mood check-in #{idx}: {mood_data['mood']} (intensity {mood_data['intensity']}) ---")
        try:
            resp = client.post(
                f"{BASE}/moods",
                json=mood_data,
                headers=header(token),
                timeout=TIMEOUT,
            )
            body = pretty(f"Mood #{idx}", resp)
        except Exception as e:
            print(f"  ❌ ERROR: {e}")
            traceback.print_exc()
        time.sleep(1)


# ========== STEP 6: Get Moods ==========

def test_get_moods(client: httpx.Client, token: str):
    print(f"\n{'#'*60}")
    print(f"# STEP 6: Get My Moods")
    print(f"{'#'*60}")

    resp = client.get(f"{BASE}/moods", headers=header(token))
    body = pretty("My Moods", resp)
    if resp.status_code == 200 and isinstance(body, dict) and "data" in body:
        moods = body["data"]
        print(f"\n  🎭 Tổng mood entries: {len(moods)}")
        for m in moods[-3:]:
            print(f"    {m['mood']} (intensity {m['intensity']}): {m.get('note', 'N/A')}")


# ========== STEP 7: Partner Mood Status (check AI alert) ==========

def test_partner_mood_status(client: httpx.Client, token: str):
    print(f"\n{'#'*60}")
    print(f"# STEP 7: Partner Mood Status (check AI Alert)")
    print(f"{'#'*60}")

    resp = client.get(
        f"{BASE}/moods/partner/latest",
        headers=header(token),
    )
    body = pretty("Partner Mood Status", resp)
    if resp.status_code == 200 and isinstance(body, dict) and body.get("data"):
        data = body["data"]
        if data.get("active_alert"):
            alert = data["active_alert"]
            print(f"\n  🚨 AI ALERT DETECTED:")
            print(f"     Type:    {alert.get('alert_type')}")
            print(f"     Title:   {alert.get('title')}")
            print(f"     Message: {alert.get('message')}")
            print(f"     Advice:  {alert.get('advice')}")
        else:
            print("\n  ℹ️  Không có AI alert nào đang active.")
        if data.get("latest_mood"):
            mood = data["latest_mood"]
            print(f"\n  🎭 Partner latest mood: {mood['mood']} (intensity {mood['intensity']})")


# ========== MAIN ==========

def main():
    print("=" * 60)
    print("  FLAMEE AI API TEST SUITE")
    print("  Testing: Chat AI (LangGraph), Mood AI Alerts")
    print("=" * 60)

    # Check server health
    with httpx.Client() as client:
        try:
            resp = client.get("http://localhost:8000/health", timeout=5)
            pretty("Health Check", resp)
        except httpx.ConnectError:
            print("❌ Server chưa chạy! Hãy chạy `python run.py` trước.")
            sys.exit(1)

    with httpx.Client() as client:
        # Step 1: Register 2 users
        user1, token1 = register_or_login(client, "testnam.flamee@gmail.com", "Test1234!", "Nguyễn Văn Nam")
        user2, token2 = register_or_login(client, "testlinh.flamee@gmail.com", "Test1234!", "Trần Thị Linh")

        print(f"\n  👤 User1: {user1.get('id', 'N/A')} - {user1.get('full_name', 'N/A')}")
        print(f"  👤 User2: {user2.get('id', 'N/A')} - {user2.get('full_name', 'N/A')}")

        # Step 2: Setup couple
        couple_id = setup_couple(client, token1, token2)
        if not couple_id:
            print("\n⚠️  Couple chưa được tạo. Một số test có thể fail.")

        # Step 3: Test Chat AI (with user1)
        test_chat_ai(client, token1)

        # Step 4: Test Chat History
        test_chat_history(client, token1)

        # Step 5: Test Mood Check-in (with user1 — 3 negative moods)
        test_mood_checkin(client, token1)

        # Step 6: Get Moods
        test_get_moods(client, token1)

        # Step 7: Check partner mood status (from user2's perspective)
        test_partner_mood_status(client, token2)

    print(f"\n{'='*60}")
    print("  TEST SUITE COMPLETED!")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
