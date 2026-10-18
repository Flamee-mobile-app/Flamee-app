# Database Schema

> Cập nhật 2026-10-17: xem [DATABASE-SETUP.md](DATABASE-SETUP.md) cho schema/migration
> đang áp dụng, session auth và giới hạn tích hợp. Các mô tả MVP bên dưới là lịch sử.

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
    username TEXT, -- Biệt danh tùy chọn, không unique, tối đa 40 ký tự sau trim
    avatar_url TEXT, -- Chỉ đọc dữ liệu legacy; upload mới không ghi public URL
    avatar_storage_path TEXT, -- Path private trong bucket flamee-media
    birth_date TEXT,
    gender TEXT,
    couple_id TEXT, -- Trỏ tới id của couples, null nếu chưa ghép đôi
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

### Contract `username` — 2026-10-17

- `username` là biệt danh hiển thị của chính user, tách với `full_name`, email
  đăng nhập và biệt danh người yêu trên mobile. Cho phép tiếng Việt, khoảng
  trắng bên trong và các tài khoản trùng biệt danh; không dùng để đăng nhập.
- Tùy chọn khi `POST /api/v1/auth/register`; mặc định `null`. Server trim hai
  đầu rồi giới hạn 40 ký tự. Biệt danh rỗng được lưu thành `null`.
- `GET/PUT /api/v1/users/me` và `GET/PUT /api/v1/auth/me` cùng đọc/sửa trường
  này. Login/register cũng trả `username` trong `data.user`. Token quyết định
  tài khoản được sửa; không nhận user ID để đổi chủ thể cập nhật.
- Với PUT, bỏ trường hoặc gửi `null` giữ nguyên giá trị, giống các trường profile
  hiện có. Gửi `{"username":""}` để bỏ biệt danh. Quá 40 ký tự sau trim trả 422.
- Cần review và áp dụng `../migrations/20261017_profile_username.sql` trước
  khi sử dụng các thao tác ghi với backend mới. Migration chỉ thêm cột nullable
  và CHECK, không backfill tên giả hoặc đặt biệt danh cho tài khoản cũ.
- Mobile form hồ sơ đã nối GET/PUT `/auth/me` cho `full_name` và `username`. Chỉ báo lưu sau response server hợp lệ; không còn lưu hồ sơ vào service local. Migration ở trên vẫn chưa được agent áp dụng; chưa kiểm tra ghi hồ sơ trên dịch vụ thật.

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
    url TEXT, -- URL legacy; upload mới để null
    thumbnail_url TEXT, -- URL legacy; upload mới để null
    storage_path TEXT, -- Bản lớn private, server sinh key
    thumbnail_path TEXT, -- Thumbnail private, server sinh key
    mime_type TEXT,
    size_bytes INTEGER,
    uploaded_by TEXT NOT NULL REFERENCES users(id),
    width INTEGER,
    height INTEGER,
    created_at TEXT NOT NULL
);
```
*Ghi chú:* asset mới được lưu trong bucket private `flamee-media`. Database chỉ lưu
path ổn định; API kiểm tra quyền rồi tạo signed URL tối đa 15 phút. Bucket/URL công
khai cũ được giữ cho dữ liệu legacy cho đến khi có migration dữ liệu riêng.

Schema này cần migration `20261018_private_media_pipeline.sql`; file migration đã
được viết nhưng chưa chạy trên Supabase.

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
