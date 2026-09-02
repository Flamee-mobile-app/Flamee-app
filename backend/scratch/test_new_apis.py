import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from dotenv import load_dotenv
load_dotenv()

from app.main import create_app
from app.api.deps import get_current_user
from app.database import get_supabase

app = create_app()
db = get_supabase()

def test_new_apis():
    print("=== TESTING NEW APIs ===")
    
    # 1. Tìm user trong DB để test
    res_users = db.table("users").select("id, full_name, couple_id").limit(1).execute()
    if not res_users.data:
        print("❌ LỖI: Không tìm thấy user nào trong DB để test.")
        return
        
    user = res_users.data[0]
    user_id = user["id"]
    print(f"👤 Đang test với User: {user['full_name']} ({user_id})")
    
    # Mock đăng nhập
    app.dependency_overrides[get_current_user] = lambda: {"id": user_id, "couple_id": user.get("couple_id")}
    client = TestClient(app)
    
    # 1. GET /api/v1/users/me
    print("\n--- TEST GET /api/v1/users/me ---")
    res_me = client.get("/api/v1/users/me")
    if res_me.status_code == 200:
        print(" ✅ Thành công! Thông tin cá nhân:", res_me.json()["data"])
    else:
        print(" ❌ Thất bại:", res_me.json())
        
    # 2. PUT /api/v1/users/me
    print("\n--- TEST PUT /api/v1/users/me ---")
    res_update_me = client.put("/api/v1/users/me", json={"full_name": user["full_name"] + " (Test)", "gender": "male"})
    if res_update_me.status_code == 200:
        print(" ✅ Đổi tên và giới tính thành công:", res_update_me.json()["data"])
        # Đổi lại tên cũ cho sạch DB
        client.put("/api/v1/users/me", json={"full_name": user["full_name"]})
    else:
        print(" ❌ Thất bại:", res_update_me.json())
        
    # 3. PUT /api/v1/users/me/password
    print("\n--- TEST PUT /api/v1/users/me/password ---")
    res_pwd = client.put("/api/v1/users/me/password", json={"new_password": "new_password_123"})
    if res_pwd.status_code == 200:
        print(" ✅ Đổi mật khẩu thành công!")
    else:
        print(" ❌ Thất bại:", res_pwd.json())
        
    # 4. POST /api/v1/users/me/device-token
    print("\n--- TEST POST /api/v1/users/me/device-token ---")
    res_token = client.post("/api/v1/users/me/device-token", json={"fcm_token": "test_fcm_token_xyz_123"})
    if res_token.status_code == 200:
        print(" ✅ Lưu Device Token thành công!")
    else:
        print(f" ❌ Thất bại: {res_token.json()}")
        print("    👉 NẾU LỖI LÀ 'fcm_token column does not exist' => VUI LÒNG CHẠY LỆNH SQL: ALTER TABLE users ADD COLUMN fcm_token TEXT;")

    # 5. GET /api/v1/feed/home
    print("\n--- TEST GET /api/v1/feed/home ---")
    res_feed = client.get("/api/v1/feed/home")
    if res_feed.status_code == 200:
        data = res_feed.json()["data"]
        print(f" ✅ Lấy Home Feed thành công!")
        print(f"    - Đã có Couple: {data['has_couple']}")
        if data['has_couple']:
            print(f"    - Số ngày yêu nhau: {data['couple']['days_together']}")
            print(f"    - Cảm xúc người yêu: {data['partner_latest_mood']['mood'] if data['partner_latest_mood'] else 'Không có'}")
            print(f"    - Cảnh báo AI: {data['active_alert']['title'] if data['active_alert'] else 'Không có'}")
            print(f"    - Số kỷ niệm sắp tới: {len(data['upcoming_memories'])}")
    else:
        print(" ❌ Thất bại:", res_feed.json())
        
    # 6. GET /api/v1/chat/history
    print("\n--- TEST GET /api/v1/chat/history ---")
    res_chat = client.get("/api/v1/chat/history")
    if res_chat.status_code == 200:
        msgs = res_chat.json()["data"]
        print(f" ✅ Lấy Lịch sử Chat thành công! Có {len(msgs)} tin nhắn.")
    else:
        print(" ❌ Thất bại:", res_chat.json())

if __name__ == "__main__":
    test_new_apis()
