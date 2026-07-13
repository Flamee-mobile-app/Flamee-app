# API Specification

> MVP: 5 modules, ~33 endpoints. Ngắn gọn, đủ dùng.
> Auto-generated OpenAPI docs ở `/docs` (Swagger UI) khi chạy FastAPI.

---

## 1. Quy ước chung

### Base URL
- Dev: `http://localhost:8000/api/v1`
- Cloud: `https://<your-app>.onrender.com/api/v1` (sau khi deploy)

### Authentication
- Header: `Authorization: Bearer <access_token>`
- Access token TTL: 24h (đơn giản cho MVP, không cần refresh token)
- Body request/response: JSON

### Response chuẩn
```json
{
  "success": true,
  "data": { ... }
}
```

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [{ "field": "email", "message": "Required" }]
  }
}
```

### Status codes
- `200` OK
- `201` Created
- `204` No Content
- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `409` Conflict
- `500` Internal Server Error

---

## 2. Module: Auth (6 endpoints)

### `POST /auth/register`
Đăng ký tài khoản mới.
```json
// Request
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "full_name": "Nguyễn Văn A"
}

// Response 201
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "full_name": "..." },
    "access_token": "eyJ..."
  }
}
```

### `POST /auth/login`
Đăng nhập.
```json
// Request
{ "email": "user@example.com", "password": "SecurePass123" }

// Response 200
{ "success": true, "data": { "user": {...}, "access_token": "..." } }
```

### `GET /auth/me`
Lấy thông tin user hiện tại (cần Bearer token).
```json
// Response 200
{ "success": true, "data": { "id": "...", "email": "...", "full_name": "...", "couple_id": "..." } }
```

### `POST /auth/change-password`
Đổi mật khẩu.
```json
// Request
{ "current_password": "OldPass123", "new_password": "NewPass456" }
```

### `POST /auth/forgot-password`
Gửi OTP reset (MVP: in-memory, không gửi email thật).
```json
// Request
{ "email": "user@example.com" }

// Response 200
{ "success": true, "data": { "otp": "123456", "expires_in": 600 } }
```

### `POST /auth/reset-password`
Reset mật khẩu bằng OTP.
```json
// Request
{ "email": "user@example.com", "otp": "123456", "new_password": "NewPass456" }
```

---

## 3. Module: Profile (4 endpoints)

### `GET /profile`
Lấy profile của user hiện tại.

### `PUT /profile`
Cập nhật profile.
```json
// Request
{
  "full_name": "Nguyễn Văn B",
  "avatar_url": "https://...",
  "birth_date": "1995-05-20",
  "gender": "male",
  "preferences": {
    "hobbies": ["reading", "coffee"],
    "food": ["vietnamese", "japanese"],
    "music": ["ballad"],
    "movie": ["romance"],
    "travel": ["beach"]
  }
}
```

### `GET /profile/partner`
Lấy profile của partner (chỉ khi đã match couple).

### `POST /profile/avatar`
Upload avatar (multipart form-data).
```bash
curl -X POST /profile/avatar \
  -H "Authorization: Bearer ..." \
  -F "file=@avatar.jpg"
```

---

## 4. Module: Couple & Invite (5 endpoints)

### `POST /couple/invite-code`
Tạo invite code (1 user chỉ có 1 code active).
```json
// Response 201
{ "success": true, "data": { "code": "FLM-A1B2C3", "expires_at": "..." } }
```

### `GET /couple/invite-code`
Lấy invite code hiện tại của tôi.

### `POST /couple/accept-invite`
Accept invite code (gửi từ partner).
```json
// Request
{ "code": "FLM-A1B2C3" }

// Response 200
{ "success": true, "data": { "couple": { "id": "...", "members": [...] } } }
```

### `GET /couple`
Lấy thông tin couple hiện tại.
```json
// Response 200
{
  "success": true,
  "data": {
    "id": "...",
    "anniversary_date": "2024-02-14",
    "created_at": "...",
    "members": [
      { "user_id": "...", "full_name": "...", "avatar_url": "..." },
      { "user_id": "...", "full_name": "...", "avatar_url": "..." }
    ]
  }
}
```

### `PUT /couple/anniversary`
Cập nhật ngày kỉ niệm.
```json
// Request
{ "anniversary_date": "2024-02-14" }
```

---

## 5. Module: Memory (7 endpoints)

### `GET /memories`
Lấy danh sách memories (phân trang).
```
Query params:
  page: int = 1
  limit: int = 20
  year: int = 2025
  category: str = "anniversary"
```

### `POST /memories`
Tạo memory mới.
```json
// Request
{
  "title": "Lần hẹn hò đầu tiên",
  "description": "...",
  "event_date": "2024-02-14",
  "category": "first_date",
  "location": "Hồ Gươm, Hà Nội",
  "tags": ["cafe", "spring"],
  "is_recurring": false
}
```

### `GET /memories/{id}`
Chi tiết memory (kèm danh sách ảnh).

### `PUT /memories/{id}`
Cập nhật memory.

### `DELETE /memories/{id}`
Xóa memory.

### `POST /memories/{id}/images`
Upload nhiều ảnh cho memory.
```bash
curl -X POST /memories/abc/images \
  -H "Authorization: Bearer ..." \
  -F "files=@photo1.jpg" \
  -F "files=@photo2.jpg"
```

### `DELETE /memories/{id}/images/{image_id}`
Xóa 1 ảnh.

---

## 6. Module: Mood + AI (8 endpoints) — **module quan trọng nhất**

### `GET /moods/today`
Lấy mood checkin hôm nay của tôi.

### `POST /moods`
Checkin mood hôm nay.
```json
// Request
{
  "mood": "happy",
  "intensity": 8,
  "note": "Hôm nay trời đẹp, đi cafe với ny",
  "is_private": false
}

// Mood enum: love, happy, excited, calm, neutral, tired, sad, angry, anxious, sick
// intensity: 1-10
```

### `PUT /moods/{id}`
Cập nhật mood checkin (trong ngày).

### `GET /moods`
Lấy lịch sử mood.
```
Query params:
  days: int = 7   # 7 ngày gần nhất
  partner: bool = false  # bao gồm mood của partner
```

### `GET /moods/partner/latest`
Lấy mood mới nhất của partner (cho Home screen).

### `GET /moods/ai/insights` ⭐ **Smart**
Lấy AI insights về mood 3-7 ngày gần nhất.
```json
// Response 200
{
  "success": true,
  "data": {
    "risk_level": "medium",  // none | low | medium | high
    "alert": {
      "should_notify": true,
      "title": "Người ấy có chuyện buồn",
      "message": "Anh Minh đã có vài ngày tâm trạng không tốt...",
      "actions": [
        "Gọi điện hỏi thăm tối nay",
        "Nấu món ăn yêu thích",
        "Lên kế hoạch đi chơi cuối tuần"
      ]
    },
    "trend": "declining",
    "recommendation": "Hãy dành thời gian quan tâm"
  }
}
```
Xem chi tiết ở [`ai.md`](./ai.md#31-mood-analyzer--phân-tích-3-ngày).

### `GET /moods/ai/partner-status` ⭐ **Smart**
Lấy trạng thái mood partner + cảnh báo (gộp insights + latest).
Dùng cho Home screen để hiển thị banner cảnh báo.

### `GET /moods/stats`
Thống kê mood (streak, top mood, ...).
```json
{
  "success": true,
  "data": {
    "current_streak": 12,      // Số ngày liên tiếp checkin
    "longest_streak": 45,
    "total_checkins": 89,
    "top_mood": "happy",
    "avg_intensity": 6.5
  }
}
```

---

## 7. Module: Date Plan + AI (7 endpoints)

### `GET /date-plans`
Lấy danh sách date plans.
```
Query params:
  status: str = "all"   # pending | accepted | declined | completed | cancelled | all
  timeframe: str = "upcoming"  # upcoming | past | this_week
```

### `POST /date-plans`
Tạo date plan mới (gửi cho partner).
```json
// Request
{
  "title": "Dinner tối thứ 6",
  "description": "Đi ăn ở nhà hàng mới",
  "category": "dining",
  "start_time": "2026-07-11T19:00:00",
  "end_time": "2026-07-11T22:00:00",
  "location_name": "The Gourmet",
  "location_address": "123 Lê Lợi, Q1",
  "location_lat": 10.762622,
  "location_lng": 106.660172,
  "budget": 1500000
}
```

### `GET /date-plans/{id}`
Chi tiết date plan.

### `PUT /date-plans/{id}`
Cập nhật date plan (chỉ khi pending).

### `POST /date-plans/{id}/accept`
Partner accept.

### `POST /date-plans/{id}/decline`
Partner decline.
```json
// Request
{ "reason": "Bận họp", "suggest_another_time": "2026-07-12T19:00:00" }
```

### `POST /date-plans/{id}/complete`
Đánh dấu đã xong + rating + photos.
```json
// Request
{
  "rating": 5,
  "feedback": "Tuyệt vời!",
  "photo_urls": ["..."]
}
```

---

## 8. Module: AI Date Suggestions (2 endpoints)

### `GET /date-plans/suggestions` ⭐ **Smart**
Lấy gợi ý date ideas cá nhân hoá.
```
Query params:
  category: str (optional)
  budget: float (optional)
  count: int = 5
```
```json
// Response 200
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "template_id": "...",
        "title": "Picnic ở công viên",
        "description": "...",
        "estimated_cost": 300000,
        "duration_min": 120,
        "difficulty": "easy",
        "steps": ["Chuẩn bị đồ ăn", "Chọn chỗ râm mát", "..."],
        "tips": ["Mang theo bình nước"],
        "match_reason": "Phù hợp với thời tiết và sở thích ngoài trời của cả 2",
        "confidence": 0.85
      }
    ],
    "source": "ai",  // ai | rule_based
    "cached": false
  }
}
```

### `POST /date-plans/suggestions/refresh` ⭐ **Smart**
Force refresh (gọi lại AI, không dùng cache).
- Rate limit: 5 lần/ngày/user.

Xem chi tiết thuật toán ở [`ai.md`](./ai.md#32-date-suggester--gợi-ý-date-idea).

---

## 9. Endpoints dành cho Background Jobs (3 endpoints - internal)

Dùng cho cron jobs / background tasks:

### `POST /internal/moods/analyze-all-couples` (no auth, chỉ gọi từ cron)
Phân tích mood cho tất cả couples. Chạy mỗi tối 21:00.

### `POST /internal/memories/check-reminders` (no auth)
Gửi reminder cho memories sắp tới. Chạy mỗi sáng 08:00.

### `POST /internal/date-plans/check-tomorrow` (no auth)
Nhắc date plan ngày mai. Chạy mỗi tối 20:00.

**Bảo vệ**: Các endpoint `/internal/*` được bảo vệ bằng secret token qua header `X-Internal-Token`.

---

## 10. Tổng kết

| Module | Endpoints |
|--------|-----------|
| Auth | 6 |
| Profile | 4 |
| Couple & Invite | 5 |
| Memory | 7 |
| Mood + AI | 8 |
| Date Plan | 7 |
| AI Suggestions | 2 |
| Internal | 3 |
| **Tổng** | **42** |

(Documents ban đầu nói 33, bao gồm thêm internal endpoints = 42.)

---

## 11. Lưu đồ quan trọng

### Flow: Match couple

```
User A                                    User B
  │                                          │
  ├─ POST /auth/register                     ├─ POST /auth/register
  │                                          │
  ├─ POST /couple/invite-code                │
  │  → code: FLM-A1B2C3                      │
  │                                          │
  │ ─── (gửi code qua email/SMS) ────>       │
  │                                          │
  │                                          ├─ POST /couple/accept-invite
  │                                          │  { code: "FLM-A1B2C3" }
  │                                          │  → couple created
  │                                          │
  │ ←── (couple matched) ──                   │
  │                                          │
  ├─ GET /couple → thấy partner info         ├─ GET /couple
  │                                          │
  └─ Bắt đầu dùng app                        └─ Bắt đầu dùng app
```

### Flow: Mood checkin + AI alert

```
User A                          User B
  │                               │
  ├─ POST /moods                  │
  │  { mood: "sad", ... }         │
  │  → 201 Created                │
  │                               │
  │ (background)                  │
  │  ↓                            │
  │  Lấy 3 mood gần nhất          │
  │  Rule check → risk: medium    │
  │  Gọi AI → generate alert     │
  │  ↓                            │
  │  Gửi notification ────────>   ├─ GET /moods/ai/partner-status
  │                               │  → thấy alert
  │                               │
  │                               ├─ (optional) Gọi điện hỏi thăm
  │                               │
  └─ User A vẫn dùng app          └─ User B đã quan tâm
```

### Flow: AI date suggestion

```
User A & B
  │
  ├─ GET /date-plans/suggestions?budget=1000000
  │   │
  │   ├─ 1. Lấy templates từ DB (rule filter)
  │   ├─ 2. Loại templates đã làm gần đây
  │   ├─ 3. Gọi AI để rank top 5
  │   └─ 4. Trả về suggestions
  │
  ├─ User chọn 1 suggestion
  │
  ├─ POST /date-plans { template_id: "...", ... }
  │  → Tạo date plan
  │
  └─ Status: pending → partner accept → accepted
```