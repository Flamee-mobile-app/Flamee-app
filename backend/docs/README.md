# Flamee Backend - Architecture & Design

> Ứng dụng cho các cặp đôi. Stack: **Python + FastAPI + SQLite (dev) → PostgreSQL (cloud)**.

---

## 1. Triết lý thiết kế

- **Đơn giản, gọn, hiệu quả** — không over-engineer, không tính năng dư.
- **3 tầng rõ ràng**: `Controller (API) → Service (logic) → Repository (data)`.
- **Code dễ đọc, dễ bảo trì** — convention quyết định trước, mọi module follow giống nhau.
- **Tập trung vào "smart"**: AI/Mood analysis/Recommendation/Personalization là giá trị cốt lõi, không phải CRUD.
- **Cloud-ready**: chạy local với SQLite, deploy cloud (Railway/Render/Fly.io) với PostgreSQL chỉ qua đổi biến môi trường.

---

## 2. Kiến trúc 3 tầng

```
┌─────────────────────────────────────────────────────────┐
│  CLIENT (Mobile App)                                    │
│  → HTTP/JSON, Bearer Token                              │
└────────────────────────┬────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│  TẦNG 1: CONTROLLER (api/)                              │
│  - Nhận request, validate input (Pydantic)               │
│  - Gọi Service, trả response                            │
│  - KHÔNG chứa business logic                            │
│  - File mỏng, chỉ routing + I/O                         │
└────────────────────────┬────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│  TẦNG 2: SERVICE (services/)                            │
│  - Business logic thuần túy                             │
│  - Orchestrate nhiều Repository                          │
│  - Gọi AI service khi cần                               │
│  - KHÔNG biết về HTTP, KHÔNG truy cập DB trực tiếp      │
└────────────────────────┬────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│  TẦNG 3: REPOSITORY (repositories/)                     │
│  - SQLAlchemy ORM queries                               │
│  - Một class = một table/entity                         │
│  - Trả về model objects (không dict)                    │
│  - KHÔNG có business logic                              │
└────────────────────────┬────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│  DATABASE: SQLite (dev) / PostgreSQL (prod)             │
│  Cùng SQLAlchemy ORM, swap driver qua env var           │
└─────────────────────────────────────────────────────────┘
```

### Quy tắc vàng

1. **Controller chỉ làm 3 việc**: nhận request → gọi service → trả response. Không `if`, không logic.
2. **Service là "bộ não"**: tất cả quyết định nghiệp vụ, gọi AI, gọi repo. Pure function, dễ test.
3. **Repository chỉ biết SQL/ORM**: trả về object, không xử lý logic.
4. **AI tách riêng thành `ai/` module**: service gọi qua interface, dễ swap model.
5. **Pydantic schemas** ở `schemas/` — dùng chung cho request/response. Model ORM tách biệt ở `models/`.

---

## 3. Cấu trúc thư mục backend

```
backend/
├── app/
│   ├── main.py                 # FastAPI app, middleware, include routers
│   ├── config.py               # Settings (env vars, Pydantic BaseSettings)
│   ├── database.py             # SQLAlchemy engine, SessionLocal
│   │
│   ├── api/                    # TẦNG 1: CONTROLLER
│   │   ├── deps.py             # get_db, get_current_user, get_couple
│   │   ├── auth.py             # /auth/*
│   │   ├── profile.py          # /profile/*
│   │   ├── couple.py           # /couple/*, /invite/*
│   │   ├── memory.py           # /memories/*
│   │   ├── mood.py             # /moods/*
│   │   └── date_plan.py        # /date-plans/*
│   │
│   ├── services/               # TẦNG 2: BUSINESS LOGIC
│   │   ├── auth_service.py
│   │   ├── profile_service.py
│   │   ├── couple_service.py
│   │   ├── memory_service.py
│   │   ├── mood_service.py
│   │   └── date_plan_service.py
│   │
│   ├── repositories/           # TẦNG 3: DATA ACCESS
│   │   ├── base.py             # BaseRepository với CRUD chung
│   │   ├── user_repo.py
│   │   ├── couple_repo.py
│   │   ├── memory_repo.py
│   │   ├── mood_repo.py
│   │   └── date_plan_repo.py
│   │
│   ├── models/                 # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── couple.py
│   │   ├── memory.py
│   │   ├── mood.py
│   │   └── date_plan.py
│   │
│   ├── schemas/                # Pydantic schemas (request/response)
│   │   ├── auth.py
│   │   ├── profile.py
│   │   ├── couple.py
│   │   ├── memory.py
│   │   ├── mood.py
│   │   └── date_plan.py
│   │
│   ├── ai/                     # AI MODULE (linh hoạt, swap được)
│   │   ├── provider.py         # AIProvider interface
│   │   ├── openai_provider.py
│   │   ├── anthropic_provider.py
│   │   └── prompts.py          # Tất cả prompt template ở 1 chỗ
│   │
│   ├── smart/                  # LOGIC THÔNG MINH
│   │   ├── mood_analyzer.py    # Phân tích mood 3 ngày → cảnh báo
│   │   ├── date_suggester.py   # Gợi ý date idea cá nhân hoá
│   │   ├── mission_picker.py   # Daily mission dựa trên context
│   │   └── reminder_scheduler.py # Smart reminder
│   │
│   ├── core/                   # Shared utilities
│   │   ├── security.py         # JWT, password hash
│   │   ├── exceptions.py       # Custom exceptions + handlers
│   │   └── constants.py
│   │
│   └── utils/
│       └── time_utils.py
│
├── tests/
│   ├── test_auth.py
│   ├── test_mood_analyzer.py
│   └── ...
│
├── docs/                       # Documentation
│   ├── README.md               # File này
│   ├── api.md                  # API spec ngắn gọn
│   ├── database.md             # DB schema chi tiết
│   ├── ai.md                   # AI provider + smart logic
│   ├── deployment.md           # Local → Cloud
│   └── openapi.yaml            # Auto-generated bởi FastAPI
│
├── alembic/                    # DB migrations (PostgreSQL)
│   └── versions/
│
├── requirements.txt
├── .env.example
├── alembic.ini
├── Dockerfile
└── README.md
```

---

## 4. Module MVP (5 modules chính)

| # | Module | Mục đích | Endpoints |
|---|--------|----------|-----------|
| 1 | **Auth** | Đăng ký/đăng nhập/OTP/JWT | 6 |
| 2 | **Couple** | Ghép đôi, invite code, partner | 5 |
| 3 | **Memory** | Sổ kỉ niệm, upload ảnh, reminder | 7 |
| 4 | **Mood + AI** | Checkin mood, AI phân tích 3 ngày | 8 |
| 5 | **Date Plan** | Lên kế hoạch hẹn hò, AI gợi ý | 7 |
| | **Tổng** | | **~33** |

> Không làm trong MVP: Tiny Mission, Premium, Reward. Để dành cho phase 2.

---

## 5. Tích hợp AI — linh hoạt, swap được

### Vấn đề
Mỗi AI provider (OpenAI, Anthropic, local LLM) có API khác nhau. Cần một lớp trung gian.

### Giải pháp: Strategy Pattern

```python
# ai/provider.py
class AIProvider(Protocol):
    async def chat(self, messages: list[dict], **opts) -> str: ...
    async def embed(self, text: str) -> list[float]: ...
```

- `OpenAIProvider`, `AnthropicProvider`, `OllamaProvider` đều implement interface trên.
- Chọn provider qua env: `AI_PROVIDER=openai|anthropic|ollama`.
- Đổi model qua env: `AI_MODEL=gpt-4o-mini|claude-3-5-haiku|llama3`.

### Lợi ích
- Dev dùng OpenAI (nhanh, rẻ).
- Cloud có thể đổi Anthropic (chất lượng cao).
- Tương lai có thể tự host LLM (Ollama) — không phải đổi code.

### Nguyên tắc AI trong Flamee
1. **Prompt ở 1 chỗ duy nhất** (`ai/prompts.py`) — sửa prompt không phải lùng code.
2. **Fallback gracefully** — AI lỗi → trả về rule-based (vẫn hoạt động được).
3. **Cache kết quả** — gợi ý date/mission không cần gọi AI mỗi request.
4. **Giới hạn cost** — rate limit + max tokens.

---

## 6. Smart Logic — điểm khác biệt cốt lõi

> Đây là phần "thông minh" của Flamee, không phải CRUD.

### 6.1. Mood Analyzer (`smart/mood_analyzer.py`)

**Mục tiêu**: Phát hiện mood tiêu cực kéo dài của partner → cảnh báo.

**Thuật toán (rule-based + AI)**:

```python
def analyze_recent_mood(moods: list[Mood]) -> MoodAlert | None:
    """
    Bước 1: Lấy mood 3 ngày gần nhất.
    Bước 2: Rule-based: nếu 3 ngày liên tiếp đều 'negative' (sad/angry/tired/anxious)
            → risk = medium.
    Bước 3: Gọi AI để:
            - Đọc note của user (nếu có).
            - Đánh giá severity (low/medium/high).
            - Generate message cảnh báo tế nhị, không xâm phạm.
            - Gợi ý 3 hành động cho partner.
    Bước 4: Trả về MoodAlert.
    """
```

**Prompt mẫu** (xem `ai/prompts.py`):
```
Bạn là trợ lý tâm lý nhẹ nhàng. Partner của user đã có tâm trạng tiêu cực 3 ngày liên tiếp.

Mood gần đây:
- Ngày 1: buồn (intensity 3) — "Mệt quá, không muốn gặp ai"
- Ngày 2: mệt (intensity 4) — ""
- Ngày 3: buồn (intensity 2) — "..."

Hãy:
1. Đánh giá mức độ (low/medium/high).
2. Viết 1 tin nhắn cảnh báo ngắn (< 200 ký tự) cho partner.
3. Gợi ý 3 hành động phù hợp.

Lưu ý: Không chẩn đoán bệnh. Không gây hoang mang. Khuyến khích quan tâm nhẹ nhàng.
```

**Output JSON**:
```json
{
  "risk": "medium",
  "title": "Người ấy có chuyện buồn",
  "message": "Anh ấy đã có vài ngày không vui. Hãy dành chút thời gian hỏi thăm nhé.",
  "actions": ["Gọi điện hỏi thăm", "Nấu món ăn yêu thích", "Lên kế hoạch đi chơi cuối tuần"]
}
```

**Khi nào trigger**:
- Sau khi partner checkin mood xong → chạy analyzer.
- Hoặc cronjob mỗi tối 21:00 phân tích tổng quan.

### 6.2. Date Suggester (`smart/date_suggester.py`)

**Mục tiêu**: Gợi ý date idea cá nhân hoá theo preferences của couple + context (thời tiết, mood, lịch sử).

**Input**:
- Preferences của couple (đã lưu ở profile)
- Mood gần đây
- Thời tiết (API bên ngoài, optional)
- Budget
- Lịch sử date plans (tránh lặp)

**Cách hoạt động**:
1. **Rule-based filter trước**: lấy từ 1 danh sách templates (~30 idea có sẵn) trong DB, lọc theo budget/weather/category yêu cầu.
2. **AI ranking**: gửi top 10 candidates + context cho AI, AI chọn 5 phù hợp nhất + giải thích ngắn.

```python
async def suggest_dates(couple: Couple, ctx: DateContext) -> list[DateIdea]:
    # 1. Lấy template phù hợp (rule-based)
    candidates = repo.get_date_templates(category=ctx.category, budget=ctx.budget)

    # 2. Lọc bỏ cái đã làm
    recent = repo.get_recent_date_plans(couple.id, days=60)
    candidates = [c for c in candidates if c.id not in [r.template_id for r in recent]]

    # 3. AI ranking
    ranked = await ai_provider.rank_date_ideas(
        candidates=candidates,
        preferences=couple.preferences,
        mood=ctx.mood,
        weather=ctx.weather,
    )

    return ranked[:5]
```

**Lợi ích**:
- Không phụ thuộc hoàn toàn vào AI (vẫn có gợi ý khi AI lỗi).
- Chi phí AI thấp (chỉ ranking, không gen từ đầu).
- Cá nhân hoá tốt.

### 6.3. Mission Picker (`smart/mission_picker.py`) — Phase 2

**Mục tiêu**: Daily mission không random, mà dựa trên context couple.

**Logic**:
1. Lấy mood 7 ngày gần nhất → xác định "tone" (cần vui vẻ / cần lãng mạn / cần active).
2. Lấy lịch sử missions → tránh lặp.
3. Lấy streak → nếu sắp đạt milestone (7/14/30 ngày), chọn mission đặc biệt.
4. Kết hợp → chọn 1 mission phù hợp nhất.

Phase MVP không cần (chưa làm Mission), nhưng kiến trúc đã chừa chỗ.

### 6.4. Reminder Scheduler (`smart/reminder_scheduler.py`)

**Mục tiêu**: Nhắc đúng lúc, không làm phiền.

**Logic**:
- **Mood reminder**: nhắc vào 20:00 nếu user chưa checkin. Học thói quen: nếu user thường checkin 21:00 thì nhắc lúc 21:30 (sau 30 phút).
- **Memory reminder**: nhắc trước 1/3/7 ngày mốc kỉ niệm.
- **Date reminder**: nhắc trước 1 ngày date plan.
- **Quiet hours**: 22:00 → 07:00 không nhắc (trừ urgent).

---

## 7. Tech Stack

| Layer | Công nghệ | Lý do |
|-------|-----------|-------|
| API framework | FastAPI | Async, type hints, auto OpenAPI docs |
| ORM | SQLAlchemy 2.0 | Chuẩn, swap SQLite ↔ Postgres dễ |
| Validation | Pydantic v2 | Tích hợp sẵn FastAPI |
| Migration | Alembic | Chuẩn cho Postgres cloud |
| Auth | PyJWT + passlib[bcrypt] | JWT stateless |
| AI | OpenAI / Anthropic / Ollama | Linh hoạt qua config |
| Test | pytest + httpx | Chuẩn FastAPI |
| HTTP client (gọi AI) | httpx | Async |
| Background tasks | APScheduler (dev) / Celery (prod) | Cron jobs |

---

## 8. Cloud-ready checklist

Hệ thống được thiết kế để:

- [x] **DB swap dễ**: chỉ đổi `DATABASE_URL` (sqlite:///./dev.db → postgresql://...).
- [x] **AI provider swap dễ**: chỉ đổi `AI_PROVIDER` env.
- [x] **Stateless API**: JWT, không session, scale ngang được.
- [x] **Static files**: ảnh upload lên S3/Cloudflare R2 (chưa làm MVP).
- [x] **Config qua env**: không hardcode URL/key.
- [x] **Logging chuẩn**: structlog → log ra stdout → cloud platform capture.
- [x] **Health check**: `/health` endpoint.
- [x] **CORS**: config được qua env.

Xem chi tiết ở [`deployment.md`](./deployment.md).

---

## 9. Phạm vi tài liệu

1. [`README.md`](./README.md) - File này (kiến trúc, triết lý)
2. [`database.md`](./database.md) - Schema chi tiết, ERD, indexes
3. [`api.md`](./api.md) - API spec ngắn gọn (33 endpoints)
4. [`ai.md`](./ai.md) - AI provider + smart logic chi tiết
5. [`deployment.md`](./deployment.md) - Local setup + deploy cloud
6. `openapi.yaml` - Auto-generated bởi FastAPI ở `/docs`

---

## 10. Nguyên tắc khi code

1. **File < 200 dòng** — nếu dài quá, tách.
2. **Mỗi function < 30 dòng** — dễ đọc, dễ test.
3. **Không magic number** — đưa vào `constants.py`.
4. **Type hints đầy đủ** — IDE gợi ý, dễ refactor.
5. **Service không raise HTTPException** — raise domain exception, controller mới convert.
6. **Repo không commit session** — mở/đóng session ở dependency.
7. **Tên rõ ràng** — `get_user_by_id` thay vì `find`, `create_memory` thay vì `add`.

---

## 11. Lộ trình triển khai

| Phase | Nội dung | Thời gian ước tính |
|-------|----------|-------------------|
| **P0** | Setup project + Auth + User model | 1-2 ngày |
| **P1** | Couple matching + Invite code | 1-2 ngày |
| **P2** | Memory CRUD + Upload ảnh | 2-3 ngày |
| **P3** | Mood checkin + Mood AI analyzer | 2-3 ngày |
| **P4** | Date plan + AI suggester | 2-3 ngày |
| **P5** | Polish + Test + Deploy cloud | 2-3 ngày |
| | **Tổng MVP** | **~10-15 ngày** |

Sau MVP có thể mở rộng: Tiny Mission, Premium, Notification thật.