# Database Schema

> Chuyển đổi toàn diện sang **Supabase PostgreSQL** và sử dụng trực tiếp **Supabase Client** (Thay thế hoàn toàn SQLAlchemy và SQLite).

---

## 1. Nguyên tắc thiết kế DB (Cập nhật)

1. **Ít table, đủ dùng** — chỉ tạo bảng khi thật sự cần. MVP không cần notifications, premium, rewards.
2. **Không bảng trung gian thừa thãi** — Bảng `couple_members` đã bị loại bỏ vì Flamee chỉ dành cho đúng 2 người. Trạng thái ghép đôi được xác định trực tiếp bằng `couple_id` trên bảng `users` và `partner1_id`, `partner2_id` trên bảng `couples`.
3. **UUID cho primary key** — Text (UUID) cho bảo mật và scale.
4. **AI-Ready** — Tích hợp sẵn `pgvector` để lưu trữ Semantic Memory cho Trí tuệ nhân tạo.
5. **Soft timestamp**: `created_at`, `updated_at` cho mọi bảng (lưu dạng ISO8601 text).

---

## 2. Sơ đồ ERD tổng quan

```text
┌──────────┐ 1      1 ┌──────────┐
│   User   │──────────│  Couple  │
└──────────┘          └──────────┘
      │                     │
      │                     ├─────────────────┬─────────────────┐
      ▼                     ▼                 ▼                 ▼
┌──────────┐          ┌─────────┐      ┌──────────┐      ┌──────────┐
│InviteCode│          │ Memory  │      │Mood(TODO)│      │Date(TODO)│
└──────────┘          └─────────┘      └──────────┘      └──────────┘
                            │                 │                 │
                            ▼                 ▼                 ▼
                      ┌──────────┐      ┌──────────┐      ┌──────────┐
                      │MemoryImg │      │ChatMsgs  │      │ AIFacts  │
                      └──────────┘      └──────────┘      └──────────┘
```

**Quan hệ chính**:
- `User` ↔ `Couple` là **1-1** (Một user chỉ thuộc 1 couple duy nhất tại 1 thời điểm).
- `Couple` ↔ `Memory`, `ChatMsgs`, `AIFacts` là **1-N** (one-to-many).
- `Memory` ↔ `MemoryImage` là **1-N** (one-to-many).

---

## 3. Schema chi tiết (Đã triển khai trên Supabase)

### 3.1. `users`

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    birth_date TEXT,
    gender TEXT,
    couple_id TEXT, -- Trỏ tới id của couples, null nếu chưa ghép đôi
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

### 3.2. `couples`

```sql
CREATE TABLE couples (
    id TEXT PRIMARY KEY,
    partner1_id TEXT NOT NULL REFERENCES users(id),
    partner2_id TEXT NOT NULL REFERENCES users(id),
    anniversary TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```
*Lưu ý: Không còn bảng `couple_members`. Role của user trong couple được tự động nội suy (nếu `user.id == couple.partner1_id` thì là partner 1).*

### 3.3. `invite_codes`

```sql
CREATE TABLE invite_codes (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, expired, cancelled
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_by TEXT
);
```

### 3.4. `memories`

```sql
CREATE TABLE memories (
    id TEXT PRIMARY KEY,
    couple_id TEXT NOT NULL REFERENCES couples(id),
    created_by TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    memory_date TEXT NOT NULL,
    location TEXT,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

### 3.5. `memory_images`

```sql
CREATE TABLE memory_images (
    id TEXT PRIMARY KEY,
    memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    url TEXT NOT NULL, -- Đường dẫn file trên Supabase Storage
    thumbnail_url TEXT,
    uploaded_by TEXT NOT NULL REFERENCES users(id),
    width INTEGER,
    height INTEGER,
    created_at TEXT NOT NULL
);
```
*Ghi chú: Ảnh thực tế được lưu vào Bucket `memories` của Supabase Storage.*

---

## 4. Các Bảng AI (Mới thêm)

Flamee tích hợp tính năng **Trí nhớ dài hạn (Semantic Memory)** và **Lịch sử Chat** để AI có thể trò chuyện tự nhiên như một người bạn/chuyên gia tâm lý.

### 4.1. Kích hoạt Vector

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 4.2. `chat_messages` (Trí nhớ ngắn hạn)

Lưu lại hội thoại thuần túy.

```sql
CREATE TABLE chat_messages (
    id TEXT PRIMARY KEY,
    couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    sender_id TEXT, -- ID của user, NULL nếu là AI
    sender_role TEXT NOT NULL, -- 'user' hoặc 'ai'
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
);
```

### 4.3. `ai_facts` (Trí nhớ dài hạn)

Lưu các "sự thật" được trích xuất từ cuộc trò chuyện bằng Embedding.

```sql
CREATE TABLE ai_facts (
    id TEXT PRIMARY KEY,
    couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    fact TEXT NOT NULL, 
    embedding vector(1536), -- Vector 1536 chiều của OpenAI
    created_at TEXT NOT NULL
);
```

### 4.4. Hàm Semantic Search (`match_ai_facts`)

```sql
CREATE OR REPLACE FUNCTION match_ai_facts(
    query_embedding vector(1536),
    match_threshold float,
    match_count int,
    p_couple_id text
)
RETURNS TABLE ( id text, fact text, similarity float )
LANGUAGE sql STABLE
AS $$
    SELECT id, fact, 1 - (embedding <=> query_embedding) AS similarity
    FROM ai_facts
    WHERE couple_id = p_couple_id
        AND 1 - (embedding <=> query_embedding) > match_threshold
    ORDER BY embedding <=> query_embedding
    LIMIT match_count;
$$;
```

---

## 5. Tóm tắt các thay đổi kiến trúc DB
- **Bỏ SQLAlchemy & Alembic**: Thay vì ORM nặng nề, app dùng trực tiếp Supabase Client (`supabase-py`). Nhanh hơn, gọn hơn.
- **Bỏ SQLite**: Chạy thẳng 100% trên Postgres Cloud (Supabase) cả dev lẫn prod.
- **Lưu trữ ảnh**: Đổi từ lưu Local (file system) sang Supabase Storage (S3-compatible).
- **Trí tuệ nhân tạo**: Đã setup xong nền tảng Vector DB.