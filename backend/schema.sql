-- Bảng Users
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    birth_date TEXT,
    gender TEXT,
    couple_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Bảng Couples
CREATE TABLE couples (
    id TEXT PRIMARY KEY,
    partner1_id TEXT NOT NULL REFERENCES users(id),
    partner2_id TEXT NOT NULL REFERENCES users(id),
    anniversary TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Bảng Invite Codes (Mã mời ghép đôi)
CREATE TABLE invite_codes (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_by TEXT
);

-- Bảng Memories (Kỷ niệm)
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

-- Bảng Memory Images (Hình ảnh của Kỷ niệm)
CREATE TABLE memory_images (
    id TEXT PRIMARY KEY,
    memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    uploaded_by TEXT NOT NULL REFERENCES users(id),
    width INTEGER,
    height INTEGER,
    created_at TEXT NOT NULL
);

-- Cấu hình Storage cho ảnh
insert into storage.buckets (id, name, public) 
values ('memories', 'memories', true) 
on conflict (id) do nothing;

create policy "Cho phép xem ảnh công khai"
  on storage.objects for select
  using ( bucket_id = 'memories' );

create policy "Cho phép upload ảnh"
  on storage.objects for insert
  with check ( bucket_id = 'memories' );

create policy "Cho phép xóa ảnh"
  on storage.objects for delete
  using ( bucket_id = 'memories' );

-- ==========================================
-- PHẦN DÀNH CHO AI (TRÍ NHỚ DÀI HẠN & LỊCH SỬ CHAT)
-- ==========================================

-- 1. Kích hoạt extension pgvector của Supabase để lưu trữ Vector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Bảng Chat Messages (Lịch sử chat thuần túy - Trí nhớ ngắn hạn)
CREATE TABLE chat_messages (
    id TEXT PRIMARY KEY,
    couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    sender_id TEXT, -- ID của user (nếu là user gửi), NULL nếu là AI gửi
    sender_role TEXT NOT NULL, -- 'user' hoặc 'ai'
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- 3. Bảng AI Facts (Semantic Memory - Trí nhớ dài hạn)
-- Nơi lưu trữ các "sự thật" trích xuất từ cuộc trò chuyện.
CREATE TABLE ai_facts (
    id TEXT PRIMARY KEY,
    couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    fact TEXT NOT NULL, -- Ví dụ: "Bạn nam dị ứng với hải sản"
    embedding vector(1536), -- Vector 1536 chiều tương thích với mô hình OpenAI (text-embedding-3-small)
    created_at TEXT NOT NULL
);

-- 4. Tạo hàm tìm kiếm độ tương đồng Vector (Cosine Similarity)
-- Hàm này giúp so sánh câu hỏi của user với các "Fact" trong DB
CREATE OR REPLACE FUNCTION match_ai_facts(
    query_embedding vector(1536),
    match_threshold float,
    match_count int,
    p_couple_id text
)
RETURNS TABLE (
    id text,
    fact text,
    similarity float
)
LANGUAGE sql STABLE
AS $$
    SELECT
        id,
        fact,
        1 - (embedding <=> query_embedding) AS similarity
    FROM ai_facts
    WHERE couple_id = p_couple_id
        AND 1 - (embedding <=> query_embedding) > match_threshold
    ORDER BY embedding <=> query_embedding
    LIMIT match_count;
$$;

-- ==========================================
-- PHẦN DÀNH CHO CẢM XÚC (MOOD & NATURAL INTERACTIONS)
-- ==========================================

-- Bảng Moods (Lưu trữ các lần check-in cảm xúc)
CREATE TABLE moods (
    id TEXT PRIMARY KEY,
    couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mood TEXT NOT NULL,
    intensity INTEGER NOT NULL,
    note TEXT,
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TEXT NOT NULL
);

-- Bảng Mood Alerts (Lưu trữ các cảnh báo do AI sinh ra dựa trên Mood Streak)
CREATE TABLE mood_alerts (
    id TEXT PRIMARY KEY,
    couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- ID của người đang có cảm xúc mạnh
    alert_type TEXT NOT NULL, -- 'positive' (Vui) hoặc 'negative' (Buồn/Giận)
    title TEXT NOT NULL, -- Tiêu đề ngắn gọn báo động
    message TEXT NOT NULL, -- Diễn giải nội dung 
    advice TEXT NOT NULL, -- Lời khuyên cụ thể cho Partner
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TEXT NOT NULL
);
