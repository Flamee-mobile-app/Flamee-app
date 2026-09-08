import os
import time
import httpx
from datetime import datetime

API_URL = "http://localhost:8000/api/v1"

def run_test():
    print("========================================")
    print("Testing Ambient AI (Phase 1: Event Hooks)")
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
    print("✅ Logged in successfully")

    # 2. Add a mood with note to trigger fact extraction
    print("\n--- Test Mood Fact Extraction ---")
    mood_data = {
        "mood": "stressed",
        "intensity": 8,
        "note": "Công ty hôm nay bắt OT sấp mặt, mình mệt quá muốn bỏ việc luôn.",
        "is_private": False
    }
    
    res = client.post(f"{API_URL}/moods", json=mood_data, headers=headers1)
    if res.status_code == 201:
        print("✅ Mood created successfully")
    else:
        print(f"❌ Failed to create mood: {res.text}")
        return

    # Wait for background task to finish (LLM call might take 2-4 seconds)
    print("⏳ Waiting for background tasks to process...")
    time.sleep(5)

    # 3. Add a memory to trigger fact extraction
    print("\n--- Test Memory Fact Extraction ---")
    memory_data = {
        "title": "Chuyến đi Đà Lạt đầu tiên",
        "description": "Hai đứa lên Đà Lạt ăn bánh tráng nướng và lẩu gà lá é. Rất ngon!",
        "category": "trip",
        "location": "Đà Lạt",
        "memory_date": datetime.utcnow().isoformat() + "Z",
        "is_pinned": False,
        "reminder_enabled": False
    }
    
    res = client.post(f"{API_URL}/memories", json=memory_data, headers=headers1)
    if res.status_code == 201:
        print("✅ Memory created successfully")
    else:
        print(f"❌ Failed to create memory: {res.text}")
        return

    # Wait for background task
    print("⏳ Waiting for background tasks to process...")
    time.sleep(5)

    print("\n--- Check ai_facts in DB ---")
    from app.database import get_supabase
    db = get_supabase()
    
    # We can fetch the latest facts for this couple
    # We need the couple_id, which we can get from /auth/me
    me_res = client.get(f"{API_URL}/auth/me", headers=headers1)
    couple_id = me_res.json()["data"]["couple_id"]
    
    res = db.table("ai_facts").select("*").eq("couple_id", couple_id).order("created_at", desc=True).limit(5).execute()
    facts = res.data
    
    for f in facts:
        print(f"- Fact: {f['fact']} (Created: {f['created_at']})")

    print("\n✅ Test completed!")

if __name__ == "__main__":
    run_test()
