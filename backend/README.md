# Flamee Backend

Backend cho ứng dụng **Flamee** - app dành cho các cặp đôi.

> **Stack**: Python 3.11+ · FastAPI · SQLAlchemy 2.0 · SQLite (dev) → PostgreSQL (cloud)
> **AI**: OpenAI / Anthropic / Ollama (linh hoạt qua config)
> **Kiến trúc**: 3 tầng (Controller → Service → Repository)

---

## 📚 Tài liệu chi tiết

Xem trong thư mục [`docs/`](./docs/):

| File | Nội dung |
|------|----------|
| [docs/README.md](./docs/README.md) | Kiến trúc tổng quan, triết lý thiết kế, smart logic |
| [docs/database.md](./docs/database.md) | Schema DB (9 bảng), ERD, indexes |
| [docs/api.md](./docs/api.md) | API spec (~42 endpoints), flow diagrams |
| [docs/ai.md](./docs/ai.md) | AI provider (swap được), Smart Logic chi tiết |
| [docs/deployment.md](./docs/deployment.md) | Setup local → deploy Railway/Render/Fly.io |

---

## 🚀 Quick start

```bash
# Setup
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# Sửa .env: thêm OPENAI_API_KEY

# Seed data
python -m app.scripts.seed_data

# Run
uvicorn app.main:app --reload --port 8000
```

Mở: http://localhost:8000/docs (Swagger UI)

---

## 🏗️ Cấu trúc (planned)

```
backend/
├── app/
│   ├── api/          # Controller - HTTP routing
│   ├── services/     # Business logic
│   ├── repositories/ # Data access
│   ├── models/       # SQLAlchemy ORM
│   ├── schemas/      # Pydantic validation
│   ├── ai/           # AI provider (linh hoạt)
│   ├── smart/        # Smart logic (mood AI, date suggest, ...)
│   ├── core/         # Security, exceptions
│   └── main.py
├── tests/
├── docs/             # ← bạn đang ở đây
├── requirements.txt
├── .env.example
└── Dockerfile
```

---

## ✨ Tính năng MVP

| Module | Mô tả |
|--------|-------|
| 🔐 Auth | Đăng ký/đăng nhập/OTP/JWT |
| 💑 Couple | Ghép đôi qua invite code |
| 📸 Memory | Sổ kỉ niệm + upload ảnh + reminder |
| 💭 Mood + AI | Checkin cảm xúc + **AI phân tích 3 ngày** |
| 📅 Date Plan + AI | Lên kế hoạch hẹn hò + **AI gợi ý cá nhân hoá** |

### Smart features (điểm khác biệt cốt lõi)

- **Mood AI Analyzer**: phát hiện mood tiêu cực kéo dài → cảnh báo partner (rule-based + AI enrichment).
- **Date AI Suggester**: gợi ý date idea cá nhân hoá (rule filter trước → AI ranking → fallback graceful).
- **AI provider linh hoạt**: đổi OpenAI ↔ Anthropic ↔ Ollama qua env, không đổi code.

---

## Running locally (mock mode)

```bash
cd backend
python -m venv venv && .\venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m pytest tests/ -q
python run.py
```

Open http://localhost:8000/docs (Swagger UI). Demo accounts (seeded automatically when `FLAMEE_SEED=true`):
- `alice@demo.com` / `Demo1234!`
- `bob@demo.com` / `Demo1234!`

---

## 📖 Đọc tài liệu theo thứ tự

1. **[docs/README.md](./docs/README.md)** — Bắt đầu ở đây. Hiểu kiến trúc 3 tầng, triết lý, cấu trúc thư mục.
2. **[docs/database.md](./docs/database.md)** — Schema chi tiết, ERD, indexes.
3. **[docs/api.md](./docs/api.md)** — Danh sách endpoints, request/response, flow.
4. **[docs/ai.md](./docs/ai.md)** — AI provider + smart logic (quan trọng nhất cho "thông minh").
5. **[docs/deployment.md](./docs/deployment.md)** — Setup local → deploy cloud.

---

## 🛠️ Tech stack

- **API**: FastAPI 0.115+ (async, type hints, auto OpenAPI)
- **ORM**: SQLAlchemy 2.0 + Alembic
- **DB**: SQLite (dev) / PostgreSQL (cloud) — cùng model
- **Validation**: Pydantic v2
- **Auth**: JWT (PyJWT) + bcrypt (passlib)
- **AI**: OpenAI / Anthropic / Ollama qua unified interface
- **Background**: APScheduler (dev) → external cron (cloud)
- **Test**: pytest + pytest-asyncio

---

## 📝 Quy ước khi code

1. **3 tầng rõ ràng**: Controller chỉ routing, Service có logic, Repo chỉ truy vấn DB.
2. **Service raise domain exception**, Controller convert sang HTTPException.
3. **AI gọi qua interface**, swap provider qua env var.
4. **Prompt ở 1 chỗ** (`ai/prompts.py`).
5. **Schema tách biệt**: ORM model (SQLAlchemy) ≠ Pydantic schema.
6. **Test cho smart logic**: rule-based test được, AI test qua mock.

---

## 🚦 Status

- [x] Docs hoàn chỉnh
- [ ] Code chưa viết (chờ review docs)
- [ ] Test
- [ ] Deploy

---

## 💰 Chi phí ước tính (cloud)

| Service | Chi phí |
|---------|---------|
| Railway hosting | Free - $5/tháng |
| Railway Postgres | Free - $5/tháng |
| OpenAI API (gpt-4o-mini) | $5-20/tháng (100-500 users) |
| **Tổng MVP** | **~$10-25/tháng** |

Có thể chạy MVP với chi phí cực thấp, scale dần khi user tăng.