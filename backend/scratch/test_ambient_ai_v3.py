import os
import time
import httpx
import uuid
from datetime import datetime, timedelta, timezone

API_URL = "http://localhost:8000/api/v1"

def run_test():
    print("========================================")
    print("Testing Ambient AI v3 (Lazy Smart Feed)")
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
    user_id = me_res.json()["data"]["id"]
    
    # Giả lập Partner (Để đơn giản, test bằng tài khoản 2 nếu có, hoặc tạo tay vào DB cho partner)
    from app.database import get_supabase
    db = get_supabase()
    
    # Lấy thông tin partner
    res_couple = db.table("couples").select("*").eq("id", couple_id).execute()
    c = res_couple.data[0]
    partner_id = c["partner1_id"] if c["partner2_id"] == user_id else c["partner2_id"]

    print("🧹 Cleaning up old daily digests...")
    db.table("mood_alerts").delete().eq("user_id", user_id).eq("alert_type", "daily_digest").execute()

    print("\n--- Setup: Injecting Yesterday's Moods for Partner ---")
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat().replace("+00:00", "Z")
    
    mood_id = f"mood_{uuid.uuid4().hex[:12]}"
    mood_data = {
        "id": mood_id,
        "couple_id": couple_id,
        "user_id": partner_id,
        "mood": "tired",
        "intensity": 7,
        "note": "Cả ngày chạy deadline rã rời, buồn ngủ quá...",
        "is_private": False,
        "created_at": yesterday
    }
    db.table("moods").insert(mood_data).execute()
    print(f"✅ Inserted fake mood for yesterday: {yesterday}")

    print("\n--- Test 1: First Feed Load (Triggers Generation) ---")
    res_feed1 = client.get(f"{API_URL}/feed/home", headers=headers1)
    feed_data1 = res_feed1.json()["data"]
    print(f"Feed Response 1 Daily Digest: {feed_data1.get('daily_digest')}")
    assert feed_data1.get('daily_digest') is None, "Digest should be None because it's generating"

    print("⏳ Waiting for background LLM task to generate digest (10 seconds)...")
    time.sleep(10)

    print("\n--- Test 2: Second Feed Load (Should fetch generated Digest) ---")
    res_feed2 = client.get(f"{API_URL}/feed/home", headers=headers1)
    feed_data2 = res_feed2.json()["data"]
    digest = feed_data2.get('daily_digest')
    print(f"Feed Response 2 Daily Digest:")
    if digest:
        print(f"  Title: {digest['title']}")
        print(f"  Message: {digest['message']}")
        print(f"  Advice: {digest['advice']}")
    else:
        print("❌ FAIL: Digest is still None!")

    print("\n✅ Test completed!")

if __name__ == "__main__":
    run_test()
