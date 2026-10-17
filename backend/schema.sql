-- Bảng Users
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    username TEXT CONSTRAINT users_username_length_check
        CHECK (username IS NULL OR (char_length(username) BETWEEN 1 AND 40 AND username = btrim(username))),
    avatar_url TEXT,
    birth_date TEXT,
    gender TEXT,
    couple_id TEXT,
    fcm_token TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Bảng Couples
CREATE TABLE couples (
    id TEXT PRIMARY KEY,
    partner1_id TEXT NOT NULL REFERENCES users(id),
    partner2_id TEXT NOT NULL REFERENCES users(id),
    anniversary TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dissolved')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Bảng Invite Codes (Mã mời ghép đôi)
CREATE TABLE invite_codes (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_by TEXT REFERENCES users(id)
);

CREATE UNIQUE INDEX invite_codes_one_pending_per_user
    ON invite_codes (user_id) WHERE status = 'pending';

ALTER TABLE users
    ADD CONSTRAINT users_couple_id_fkey
    FOREIGN KEY (couple_id) REFERENCES couples(id);

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

-- Atomic invite acceptance. Keep this definition aligned with
-- migrations/20261014_invite_flow.sql.
CREATE OR REPLACE FUNCTION accept_couple_invite(
    p_invitee_id text, p_code text, p_couple_id text, p_now text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_invite invite_codes%ROWTYPE;
    v_inviter_couple text;
    v_invitee_couple text;
BEGIN
    SELECT * INTO v_invite FROM invite_codes
    WHERE code = upper(trim(p_code)) FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('outcome', 'invite_not_found'); END IF;
    IF v_invite.status = 'cancelled' THEN RETURN jsonb_build_object('outcome', 'invite_cancelled'); END IF;
    IF v_invite.status = 'accepted' THEN RETURN jsonb_build_object('outcome', 'invite_used'); END IF;
    IF v_invite.status = 'expired' OR v_invite.expires_at::timestamptz <= p_now::timestamptz THEN
        UPDATE invite_codes SET status = 'expired' WHERE id = v_invite.id;
        RETURN jsonb_build_object('outcome', 'invite_expired');
    END IF;
    IF v_invite.user_id = p_invitee_id THEN RETURN jsonb_build_object('outcome', 'self_invite'); END IF;
    PERFORM id FROM users WHERE id IN (v_invite.user_id, p_invitee_id) ORDER BY id FOR UPDATE;
    SELECT couple_id INTO v_inviter_couple FROM users WHERE id = v_invite.user_id;
    SELECT couple_id INTO v_invitee_couple FROM users WHERE id = p_invitee_id;
    IF v_invitee_couple IS NOT NULL THEN RETURN jsonb_build_object('outcome', 'already_paired'); END IF;
    IF v_inviter_couple IS NOT NULL THEN RETURN jsonb_build_object('outcome', 'inviter_already_paired'); END IF;
    INSERT INTO couples (id, partner1_id, partner2_id, anniversary, status, created_at, updated_at)
    VALUES (p_couple_id, v_invite.user_id, p_invitee_id, NULL, 'active', p_now, p_now);
    UPDATE invite_codes SET status = 'accepted', used_by = p_invitee_id WHERE id = v_invite.id;
    UPDATE users SET couple_id = p_couple_id, updated_at = p_now WHERE id IN (v_invite.user_id, p_invitee_id);
    RETURN jsonb_build_object('outcome', 'accepted', 'couple_id', p_couple_id);
END;
$$;

REVOKE ALL ON FUNCTION accept_couple_invite(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION accept_couple_invite(text, text, text, text) TO service_role;
