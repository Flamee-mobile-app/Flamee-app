# Database Schema

> SQLite (dev) ↔ PostgreSQL (cloud) — cùng SQLAlchemy ORM, swap qua env var.

---

## 1. Nguyên tắc thiết kế DB

1. **Ít table, đủ dùng** — chỉ tạo bảng khi thật sự cần. MVP không cần notifications, premium, rewards.
2. **Không JSON column cho thứ có thể query** — chỉ dùng JSON cho preferences/options ít truy vấn.
3. **UUID cho primary key** — không auto-increment int (bảo mật + dễ merge khi scale).
4. **Soft timestamp**: `created_at`, `updated_at` cho mọi bảng.
5. **Index có chủ đích** — index cột hay query (user_id, couple_id, date).
6. **SQLite-compatible** — không dùng Postgres-specific (JSONB, ARRAY, ENUM) ở tầng DB. Enum dùng String + validate ở Pydantic.

---

## 2. Sơ đồ ERD tổng quan

```
┌──────────┐       ┌──────────────┐       ┌──────────┐
│   User   │──────<│ CoupleMember │>──────│  Couple  │
└──────────┘       └──────────────┘       └──────────┘
                                              │
                            ┌─────────────────┼─────────────────┐
                            ▼                 ▼                 ▼
                       ┌─────────┐      ┌──────────┐      ┌──────────┐
                       │ Memory  │      │   Mood   │      │DatePlan  │
                       └─────────┘      └──────────┘      └──────────┘
                            │
                            ▼
                       ┌──────────┐
                       │MemoryImg │
                       └──────────┘
```

**Quan hệ chính**:
- `User` ↔ `Couple` là **many-to-many** qua `CoupleMember`.
- `Couple` ↔ `Memory`, `Mood`, `DatePlan` là **one-to-many**.
- `Memory` ↔ `MemoryImage` là **one-to-many**.

---

## 3. Schema chi tiết (7 bảng)

### 3.1. `users`

```sql
CREATE TABLE users (
    id              TEXT PRIMARY KEY,           -- UUID
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    full_name       TEXT NOT NULL,
    avatar_url      TEXT,
    birth_date      DATE,
    gender          TEXT,                        -- 'male' | 'female' | 'other'
    preferences     TEXT,                        -- JSON string (hobbies, food, music, ...)
    fcm_token       TEXT,                        -- push notification
    created_at      DATETIME NOT NULL,
    updated_at      DATETIME NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
```

**Lý do thiết kế**:
- `email` UNIQUE — đăng nhập bằng email.
- `password_hash` — bcrypt.
- `preferences` lưu JSON string (SQLite không có JSONB). Trong Postgres cloud có thể đổi sang JSONB khi migrate.
- `fcm_token` — push notification (chưa dùng MVP nhưng để sẵn).

### 3.2. `couples`

```sql
CREATE TABLE couples (
    id                TEXT PRIMARY KEY,
    anniversary_date  DATE,                       -- Ngày kỉ niệm (optional)
    couple_name       TEXT,                       -- Tên couple do 2 người đặt (optional)
    status            TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'dissolved'
    created_at        DATETIME NOT NULL,
    updated_at        DATETIME NOT NULL
);
```

### 3.3. `couple_members` (bảng trung gian)

```sql
CREATE TABLE couple_members (
    id          TEXT PRIMARY KEY,
    couple_id   TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        TEXT NOT NULL,                    -- 'partner1' | 'partner2'
    joined_at   DATETIME NOT NULL,
    UNIQUE(couple_id, user_id)
);

CREATE INDEX idx_cm_user ON couple_members(user_id);
CREATE INDEX idx_cm_couple ON couple_members(couple_id);
```

**Lý do dùng bảng trung gian**: dễ mở rộng (thêm role, joined_at, status từng member).

### 3.4. `invite_codes`

```sql
CREATE TABLE invite_codes (
    id            TEXT PRIMARY KEY,
    code          TEXT UNIQUE NOT NULL,           -- VD: 'FLM-A1B2C3'
    sender_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_email TEXT,                          -- optional
    receiver_phone TEXT,                          -- optional
    status        TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'expired' | 'cancelled'
    expires_at    DATETIME NOT NULL,
    created_at    DATETIME NOT NULL,
    accepted_at   DATETIME,
    couple_id     TEXT REFERENCES couples(id)     -- Couple tạo khi accept
);

CREATE INDEX idx_invite_code ON invite_codes(code);
CREATE INDEX idx_invite_sender ON invite_codes(sender_id);
```

**Lý do thiết kế**:
- 1 user chỉ có 1 code active tại 1 thời điểm (enforce ở service).
- Code có hạn 7 ngày.

### 3.5. `memories`

```sql
CREATE TABLE memories (
    id           TEXT PRIMARY KEY,
    couple_id    TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    description  TEXT,
    event_date   DATE NOT NULL,
    category     TEXT,                            -- 'first_date' | 'anniversary' | 'trip' | 'milestone' | 'gift' | 'moment' | 'other'
    location     TEXT,
    tags         TEXT,                            -- JSON array string
    is_recurring BOOLEAN DEFAULT 0,               -- Kỉ niệm lặp lại hằng năm
    reminder_days TEXT,                           -- JSON array: [1, 7, 30]
    created_by   TEXT NOT NULL REFERENCES users(id),
    created_at   DATETIME NOT NULL,
    updated_at   DATETIME NOT NULL
);

CREATE INDEX idx_memories_couple ON memories(couple_id);
CREATE INDEX idx_memories_event_date ON memories(couple_id, event_date DESC);
```

**Tại sao dùng JSON string cho `tags` và `reminder_days`**:
- MVP không cần query theo tag cụ thể.
- Khi cloud → có thể đổi sang JSONB Postgres nếu cần.

### 3.6. `memory_images`

```sql
CREATE TABLE memory_images (
    id          TEXT PRIMARY KEY,
    memory_id   TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,                   -- Local: '/uploads/xxx.jpg', Cloud: 'https://cdn.xxx/...'
    caption     TEXT,
    width       INTEGER,
    height      INTEGER,
    uploaded_by TEXT NOT NULL REFERENCES users(id),
    uploaded_at DATETIME NOT NULL
);

CREATE INDEX idx_memory_images_memory ON memory_images(memory_id);
```

**Lưu ý upload**:
- Dev: lưu local ở `backend/uploads/`.
- Cloud: upload lên S3/Cloudflare R2 (TODO phase 2).
- `url` chỉ lưu path, không phải binary.

### 3.7. `moods`

```sql
CREATE TABLE moods (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    couple_id    TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    date         DATE NOT NULL,
    mood         TEXT NOT NULL,                   -- 'love' | 'happy' | 'excited' | 'calm' | 'neutral' | 'tired' | 'sad' | 'angry' | 'anxious' | 'sick'
    intensity    INTEGER DEFAULT 5,               -- 1-10
    note         TEXT,
    is_private   BOOLEAN DEFAULT 0,               -- true = partner không thấy
    ai_sentiment TEXT,                            -- 'positive' | 'neutral' | 'negative' (cache AI result)
    created_at   DATETIME NOT NULL,
    updated_at   DATETIME NOT NULL,
    UNIQUE(user_id, date)                         -- 1 user chỉ checkin 1 mood/ngày
);

CREATE INDEX idx_moods_couple_date ON moods(couple_id, date DESC);
CREATE INDEX idx_moods_user_date ON moods(user_id, date DESC);
```

**Lý do `UNIQUE(user_id, date)`**: enforce ở DB, không cần check ở service.

### 3.8. `date_plans`

```sql
CREATE TABLE date_plans (
    id           TEXT PRIMARY KEY,
    couple_id    TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    description  TEXT,
    category     TEXT NOT NULL,                   -- 'dining' | 'movie' | 'travel' | 'sports' | 'cultural' | 'shopping' | 'picnic' | 'cafe' | 'party' | 'outdoor' | 'wellness' | 'other'
    start_time   DATETIME NOT NULL,
    end_time     DATETIME,
    location_name TEXT,
    location_address TEXT,
    location_lat REAL,
    location_lng REAL,
    budget       REAL,
    actual_cost  REAL,
    status       TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled'
    created_by   TEXT NOT NULL REFERENCES users(id),
    accepted_by   TEXT REFERENCES users(id),
    accepted_at   DATETIME,
    completed_at  DATETIME,
    rating       INTEGER,                         -- 1-5
    feedback     TEXT,
    template_id  TEXT,                            -- Nếu user chọn từ AI suggestion
    created_at   DATETIME NOT NULL,
    updated_at   DATETIME NOT NULL
);

CREATE INDEX idx_date_plans_couple ON date_plans(couple_id);
CREATE INDEX idx_date_plans_start_time ON date_plans(couple_id, start_time);
```

**Lưu ý location**: tách thành các cột riêng thay vì JSON, vì hay query theo khoảng cách/lat-lng.

### 3.9. `date_plan_templates` (cho AI suggester)

```sql
CREATE TABLE date_plan_templates (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    description     TEXT,
    category        TEXT NOT NULL,
    difficulty      TEXT,                         -- 'easy' | 'medium' | 'hard'
    duration_min    INTEGER,                      -- Thời gian ước tính (phút)
    estimated_cost  REAL,
    steps           TEXT,                         -- JSON array
    tips            TEXT,                         -- JSON array
    best_for        TEXT,                         -- JSON array: ['romantic', 'relaxed']
    weather_dependent BOOLEAN DEFAULT 0,
    popularity      INTEGER DEFAULT 0
);

CREATE INDEX idx_dpt_category ON date_plan_templates(category);
```

**Seed data**: ~30 template có sẵn trong file `seed_data.py`. AI chỉ rank từ đây, không gen từ đầu.

---

## 4. Không có bảng nào trong MVP

Các bảng sau **không tạo trong MVP** — để dành phase 2:

| Bảng | Phase | Lý do |
|------|-------|-------|
| `notifications` | 2 | Phase 2: cron job + FCM thật |
| `subscriptions` | 2 | Phase 2: thanh toán |
| `missions` | 2 | Phase 2: Tiny Mission |
| `rewards` | 2 | Phase 2: Premium reward |
| `devices` | 2 | Phase 2: multi-device push |
| `reminders` | 2 | Phase 2: smart reminder DB |

---

## 5. Migration Strategy

### Dev (SQLite)
- **MVP không cần Alembic** — dùng `Base.metadata.create_all()` khi app start.
- Hoặc dùng Alembic cho sạch, nhưng thêm 1 bước setup.

### Prod (PostgreSQL cloud)
- **Bắt buộc Alembic** — generate migration từ model.
- Không dùng `create_all()` trên prod (mất data khi đổi schema).

```bash
# Generate migration
alembic revision --autogenerate -m "add moods table"

# Apply
alembic upgrade head
```

### Compatibility
- Cùng SQLAlchemy model cho cả 2 DB.
- Dùng `String` thay vì `Enum` (Postgres enum ↔ SQLite).
- Dùng `JSON` (SQLAlchemy) → render thành TEXT (SQLite) / JSONB (Postgres) tuỳ driver.

---

## 6. Enum values (validate ở Pydantic, không ở DB)

Để SQLite-compatible, **không dùng native ENUM** trong DB. Enum values lưu TEXT và validate ở Pydantic schema.

```python
# schemas/enums.py
from enum import Enum

class Mood(str, Enum):
    LOVE = "love"
    HAPPY = "happy"
    EXCITED = "excited"
    CALM = "calm"
    NEUTRAL = "neutral"
    TIRED = "tired"
    SAD = "sad"
    ANGRY = "angry"
    ANXIOUS = "anxious"
    SICK = "sick"

class DateCategory(str, Enum):
    DINING = "dining"
    MOVIE = "movie"
    TRAVEL = "travel"
    # ...

class MemoryCategory(str, Enum):
    FIRST_DATE = "first_date"
    ANNIVERSARY = "anniversary"
    # ...
```

---

## 7. Sample queries thường gặp

### Lấy memories của couple theo tháng
```sql
SELECT * FROM memories
WHERE couple_id = ?
  AND event_date BETWEEN ? AND ?
ORDER BY event_date DESC;
```

### Lấy mood 3 ngày gần nhất của user (cho AI analyzer)
```sql
SELECT * FROM moods
WHERE user_id = ?
ORDER BY date DESC
LIMIT 3;
```

### Check user đã checkin mood hôm nay chưa
```sql
SELECT id FROM moods
WHERE user_id = ? AND date = DATE('now');
-- Nếu có → update, không có → insert (enforce bởi UNIQUE)
```

### Lấy date plan sắp tới
```sql
SELECT * FROM date_plans
WHERE couple_id = ?
  AND start_time > datetime('now')
  AND status IN ('accepted', 'pending')
ORDER BY start_time ASC;
```

### Lấy partners trong couple (cho notification/checkin)
```sql
SELECT u.* FROM users u
JOIN couple_members cm ON cm.user_id = u.id
WHERE cm.couple_id = ?;
```

---

## 8. Tóm tắt

| Bảng | Số cột | Quan hệ chính |
|------|--------|---------------|
| `users` | 11 | ↔ couples (qua couple_members) |
| `couples` | 6 | ↔ memories, moods, date_plans |
| `couple_members` | 5 | ↔ users, couples |
| `invite_codes` | 10 | → users, couples |
| `memories` | 12 | → couples, users |
| `memory_images` | 7 | → memories |
| `moods` | 11 | → users, couples |
| `date_plans` | 22 | → couples, users |
| `date_plan_templates` | 11 | standalone (seed data) |
| **Tổng** | **9 bảng** | |

**Đủ cho MVP**. Phase 2 sẽ thêm ~4-5 bảng nữa (notifications, missions, rewards, subscriptions, devices).