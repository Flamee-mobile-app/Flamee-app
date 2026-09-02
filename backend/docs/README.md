# Flamee Backend - Architecture & Design

> Ứng dụng cho các cặp đôi. Stack: **Python + FastAPI + Supabase (PostgreSQL & Storage)**.

---

## 1. Triết lý thiết kế

- **Đơn giản, gọn, hiệu quả** — không over-engineer, không tính năng dư.
- **3 tầng rõ ràng**: `Controller (API) → Service (logic) → Repository (data)`.
- **Code dễ đọc, dễ bảo trì** — convention quyết định trước, mọi module follow giống nhau.
- **Tập trung vào "smart"**: AI/Mood analysis/Recommendation/Personalization là giá trị cốt lõi, không phải CRUD.
- **Cloud-Native**: Sử dụng hệ sinh thái Supabase (PostgreSQL, Storage, Vector DB) ngay từ đầu để sẵn sàng scale và tích hợp AI.

---

## 2. Kiến trúc 3 tầng (Backend ↔ Supabase)

```text
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
└────────────────────────┬────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│  TẦNG 2: SERVICE (services/)                            │
│  - Business logic thuần túy                             │
│  - Gọi AI service khi cần                               │
└────────────────────────┬────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│  TẦNG 3: REPOSITORY (repositories/)                     │
│  - Xử lý Data Access bằng Supabase Client               │
│  - Trả về model objects (Pydantic)                      │
└────────────────────────┬────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│  DATABASE & STORAGE: SUPABASE                           │
│  - PostgreSQL + pgvector                                │
│  - Supabase Storage (Hình ảnh)                          │
└─────────────────────────────────────────────────────────┘
```

### Quy tắc vàng

1. **Controller chỉ làm 3 việc**: nhận request → gọi service → trả response. Không `if`, không logic phức tạp.
2. **Service là "bộ não"**: tất cả quyết định nghiệp vụ, gọi AI, gọi repo.
3. **Repository chỉ giao tiếp Supabase**: thực hiện CRUD qua Supabase SDK.
4. **AI tách riêng thành `ai/` module**: service gọi qua interface, dễ swap model.

---

## 3. Cấu trúc thư mục backend

```
backend/
├── app/
│   ├── main.py                 # FastAPI app, middleware, include routers
│   ├── config.py               # Settings (env vars, Pydantic BaseSettings)
│   ├── database.py             # Khởi tạo Supabase Client
│   │
│   ├── api/                    # TẦNG 1: CONTROLLER
│   │   ├── deps.py             # Dependencies: get_db, get_current_user
│   │   ├── auth.py             
│   │   ├── couple.py           
│   │   └── memory.py           
│   │
│   ├── services/               # TẦNG 2: BUSINESS LOGIC
│   │   ├── auth_service.py
│   │   ├── couple_service.py
│   │   └── memory_service.py
│   │
│   ├── repositories/           # TẦNG 3: DATA ACCESS (Supabase)
│   │   ├── user_repo.py
│   │   ├── couple_repo.py
│   │   └── memory_repo.py
│   │
│   ├── models/                 # Pydantic Models representing DB Schema
│   │
│   ├── schemas/                # Pydantic schemas cho API Request/Response
│   │
│   ├── ai/                     # AI MODULE (linh hoạt, swap được)
│   │
│   └── core/                   # Shared utilities (JWT, constants)
│
├── tests/                      # Pytest với FakeSupabaseClient
├── docs/                       # Tài liệu dự án
├── .env.example
├── schema.sql                  # Toàn bộ SQL script khởi tạo Supabase
├── requirements.txt
└── README.md
```

---

## 4. Tích hợp AI — linh hoạt, swap được

- App đã được chuẩn bị sẵn nền tảng **pgvector** trên Supabase.
- Hệ thống AI sử dụng interface để có thể swap linh hoạt giữa OpenAI, Anthropic, Gemini, v.v.
- Hỗ trợ **Semantic Memory** (Trí nhớ dài hạn) để AI nhớ bối cảnh người dùng.

---

## 5. Tech Stack Hiện Tại

| Layer | Công nghệ | Lý do |
|-------|-----------|-------|
| API framework | FastAPI | Async, type hints, auto OpenAPI docs |
| Database/Storage | Supabase | Nhanh gọn, Postgres mạnh mẽ, có Vector DB, Storage |
| DB Client | supabase-py | Tương tác DB không cần cấu hình ORM phức tạp |
| Validation | Pydantic v2 | Tích hợp sẵn FastAPI |
| Auth | PyJWT + passlib[bcrypt] | JWT stateless |
| AI | OpenAI (gpt-4o-mini) | Giá rẻ, đủ thông minh cho các logic xử lý ngữ cảnh |
| Test | pytest + httpx | Có hệ thống mock Supabase Client chuyên biệt |

---

## 6. Phạm vi tài liệu

1. [`README.md`](./README.md) - File này (kiến trúc, triết lý)
2. [`database.md`](./database.md) - Schema chi tiết, ERD
3. `openapi.yaml` - Auto-generated bởi FastAPI ở URL `/docs` khi chạy app.