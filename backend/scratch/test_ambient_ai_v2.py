import os
import time
import httpx
from datetime import datetime, timedelta

API_URL = "http://localhost:8000/api/v1"

def run_test():
    print("========================================")
    print("Testing Ambient AI v2 (Cooldown & Smart Extraction)")
    print("========================================")

    client = httpx.Client(timeout=10.0)

    # 1. Login user 1
    email1 = "testnam.flamee@gmail.com"
    pwd1 = "Test1234!"
    
    res = client.post(f"{API_URL}/auth/login", json={"email": email1, "password": pwd1})
    if res.status_code != 200:
        print(f"❌ Login failed: {res.text}")
        return
        
    token1 = res.json()["data"]["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}
    me_res = client.get(f"{API_URL}/auth/me", headers=headers1)
    couple_id = me_res.json()["data"]["couple_id"]
    print("✅ Logged in successfully")

    # Xóa alerts cũ để test cooldown sạch sẽ
    from app.database import get_supabase
    db = get_supabase()
    print("🧹 Cleaning up old alerts for this user...")
    db.table("mood_alerts").delete().eq("user_id", me_res.json()["data"]["id"]).execute()

    print("\n--- Test 1: Transient Feeling (Should NOT extract fact) ---")
    mood_data_1 = {
        "mood": "sad",
        "intensity": 6,
        "note": "Hôm nay mình thấy hơi đau đầu và mệt mỏi.",
        "is_private": False
    }
    client.post(f"{API_URL}/moods", json=mood_data_1, headers=headers1)
    print("✅ Transient mood created")

    print("\n--- Test 2: Long-term Fact (Should extract fact) ---")
    mood_data_2 = {
        "mood": "happy",
        "intensity": 7,
        "note": "Hôm nay được ăn món Thái yêu thích, mình cực kỳ ghiền đồ Thái luôn á!",
        "is_private": False
    }
    client.post(f"{API_URL}/moods", json=mood_data_2, headers=headers1)
    print("✅ Fact mood created")

    print("\n--- Test 3: Trigger AI Alert (Intensity = 9) ---")
    mood_data_3 = {
        "mood": "angry",
        "intensity": 9,
        "note": "Bị đồng nghiệp nói xấu sau lưng, tức điên người!",
        "is_private": False
    }
    client.post(f"{API_URL}/moods", json=mood_data_3, headers=headers1)
    print("✅ High intensity mood created (should trigger alert)")

    print("\n--- Test 4: Trigger AI Alert again (Intensity = 10, should be BLOCKED by cooldown) ---")
    mood_data_4 = {
        "mood": "stressed",
        "intensity": 10,
        "note": "Mọi thứ dồn nén lại, muốn nổ tung!",
        "is_private": False
    }
    client.post(f"{API_URL}/moods", json=mood_data_4, headers=headers1)
    print("✅ Second high intensity mood created (should be blocked by 4-hour cooldown)")

    # Đợi 10s để các task chạy xong
    print("⏳ Waiting for background LLM tasks to finish (10 seconds)...")
    time.sleep(10)

    print("\n--- CHECKING RESULTS IN DB ---")
    
    # Check facts (Should have Thai food fact, but NO headache fact)
    print("\n[AI Facts Check]")
    res_facts = db.table("ai_facts").select("*").eq("couple_id", couple_id).order("created_at", desc=True).limit(2).execute()
    for f in res_facts.data:
        print(f"Fact: {f['fact']} (Created: {f['created_at']})")

    # Check alerts (Should only have ONE alert recently due to cooldown)
    print("\n[AI Alerts Check]")
    res_alerts = db.table("mood_alerts").select("*").eq("user_id", me_res.json()["data"]["id"]).order("created_at", desc=True).limit(2).execute()
    print(f"Found {len(res_alerts.data)} alerts (Expected 1).")
    for a in res_alerts.data:
        print(f"Alert Title: {a['title']}")
        print(f"Message: {a['message']}")
        print(f"Advice: {a['advice']}")
        print(f"Created: {a['created_at']}")
        print("---")

    print("\n✅ Test completed!")

if __name__ == "__main__":
    run_test()
