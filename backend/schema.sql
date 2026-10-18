-- Fresh Supabase database only. For existing data use migrations instead.
BEGIN;

-- Bảng Users
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    username TEXT CONSTRAINT users_username_length_check
        CHECK (username IS NULL OR (char_length(username) BETWEEN 1 AND 40 AND username = btrim(username))),
    avatar_url TEXT,
    avatar_storage_path TEXT,
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
    url TEXT,
    thumbnail_url TEXT,
    storage_path TEXT,
    thumbnail_path TEXT,
    mime_type TEXT,
    size_bytes BIGINT,
    uploaded_by TEXT NOT NULL REFERENCES users(id),
    width INTEGER,
    height INTEGER,
    created_at TEXT NOT NULL
);

-- Bucket private cho media mới. Client không truy cập trực tiếp bằng policy;
-- backend service role cấp signed URL ngắn hạn sau khi kiểm tra quyền.
insert into storage.buckets (id, name, public) 
values ('flamee-media', 'flamee-media', false) 
on conflict (id) do nothing;

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

-- Keep the following block identical to migrations/20261017_backend_alignment.sql.
-- Additive alignment for the checked-in backend. Review before applying.
-- Existing database: apply invite_flow and profile_username migrations first.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'email';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS google_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh';
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free';
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS subscription_expires_at TEXT;
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS streak_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.moods ADD COLUMN IF NOT EXISTS mood_score INTEGER NOT NULL DEFAULT 3;
ALTER TABLE public.moods ADD COLUMN IF NOT EXISTS reasons JSONB NOT NULL DEFAULT '[]';
-- Derive the legacy sharing default from is_private, never expose private notes.
ALTER TABLE public.moods ADD COLUMN IF NOT EXISTS share_level TEXT;
UPDATE public.moods SET share_level = CASE WHEN is_private THEN 'private' ELSE 'all' END
WHERE share_level IS NULL;
ALTER TABLE public.moods ALTER COLUMN share_level SET DEFAULT 'all';
ALTER TABLE public.moods ALTER COLUMN share_level SET NOT NULL;
ALTER TABLE public.memory_images ADD COLUMN IF NOT EXISTS bucket TEXT NOT NULL DEFAULT 'memories';
ALTER TABLE public.memory_images ADD COLUMN IF NOT EXISTS object_key TEXT;
ALTER TABLE public.memory_images ADD COLUMN IF NOT EXISTS thumb_bucket TEXT NOT NULL DEFAULT 'memories';
ALTER TABLE public.memory_images ADD COLUMN IF NOT EXISTS thumb_object_key TEXT;
ALTER TABLE public.memory_images ADD COLUMN IF NOT EXISTS url_expires_at TEXT;

CREATE TABLE IF NOT EXISTS public.auth_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    jti TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    refresh_token TEXT UNIQUE, -- SHA-256 digest; never store the bearer value.
    refresh_expires_at TEXT,
    revoked_at TEXT,
    user_agent TEXT,
    ip_address TEXT
);
CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON public.auth_sessions(user_id);

CREATE TABLE IF NOT EXISTS public.smart_nudges (
    id TEXT PRIMARY KEY,
    couple_id TEXT NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    receiver_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    partner_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL,
    observation TEXT NOT NULL,
    action_type TEXT NOT NULL,
    draft TEXT NOT NULL,
    reason TEXT NOT NULL,
    tone TEXT NOT NULL,
    created_at TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'ai_agent',
    latency_ms INTEGER,
    snoozed_until TEXT,
    expires_at TEXT,
    is_crisis BOOLEAN NOT NULL DEFAULT FALSE,
    helplines JSONB,
    version INTEGER NOT NULL DEFAULT 1,
    snooze_count INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS smart_nudges_receiver_idx
    ON public.smart_nudges(couple_id, receiver_id, status, created_at);

CREATE TABLE IF NOT EXISTS public.tiny_moments (
    id TEXT PRIMARY KEY,
    couple_id TEXT NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    moment_type TEXT NOT NULL,
    content TEXT,
    reaction TEXT,
    nudge_id TEXT REFERENCES public.smart_nudges(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS tiny_moments_couple_idx ON public.tiny_moments(couple_id, created_at);

CREATE TABLE IF NOT EXISTS public.smart_nudge_ratings (
    id TEXT PRIMARY KEY,
    nudge_id TEXT NOT NULL REFERENCES public.smart_nudges(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating TEXT NOT NULL,
    feedback_reason TEXT,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    price BIGINT NOT NULL CHECK (price >= 0),
    currency TEXT NOT NULL DEFAULT 'VND',
    billing_cycle TEXT NOT NULL,
    interval_months INTEGER NOT NULL CHECK (interval_months > 0),
    features JSONB NOT NULL DEFAULT '[]',
    is_popular BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS public.payment_orders (
    id TEXT PRIMARY KEY,
    order_code TEXT NOT NULL UNIQUE,
    couple_id TEXT NOT NULL REFERENCES public.couples(id),
    user_id TEXT NOT NULL REFERENCES public.users(id),
    plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id),
    amount BIGINT NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    qr_code_url TEXT,
    created_at TEXT NOT NULL,
    completed_at TEXT
);

-- One UPDATE atomically consumes the old digest. Concurrent/replayed refreshes lose.
CREATE OR REPLACE FUNCTION public.rotate_auth_session(
    p_session_id TEXT, p_old_hash TEXT, p_jti TEXT, p_expires_at TEXT,
    p_new_hash TEXT, p_refresh_expires_at TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE changed INTEGER;
BEGIN
    UPDATE public.auth_sessions
    SET jti = p_jti, expires_at = p_expires_at,
        refresh_token = p_new_hash, refresh_expires_at = p_refresh_expires_at,
        updated_at = now()::TEXT
    WHERE id = p_session_id AND refresh_token = p_old_hash
        AND revoked_at IS NULL AND refresh_expires_at::timestamptz > now();
    GET DIAGNOSTICS changed = ROW_COUNT;
    RETURN changed = 1;
END;
$$;
REVOKE ALL ON FUNCTION public.rotate_auth_session(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rotate_auth_session(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- Custom JWTs are verified by FastAPI, not Supabase Auth.
-- Only the backend service role may access these application tables.
DO $$
DECLARE table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'users', 'couples', 'invite_codes', 'memories', 'memory_images',
        'chat_messages', 'ai_facts', 'moods', 'mood_alerts', 'auth_sessions',
        'smart_nudges', 'tiny_moments', 'smart_nudge_ratings',
        'subscription_plans', 'payment_orders'
    ] LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', table_name);
        EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', table_name);
    END LOOP;
END;
$$;

-- Deliberately no seeds, bucket permission changes, or object deletion here.
COMMIT;
