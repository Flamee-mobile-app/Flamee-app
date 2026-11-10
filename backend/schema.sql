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

BEGIN;
-- Complete check-in draft v2; legacy rows remain version 1.
ALTER TABLE public.moods ALTER COLUMN couple_id DROP NOT NULL;
ALTER TABLE public.moods ADD COLUMN IF NOT EXISTS draft_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.moods ADD COLUMN IF NOT EXISTS custom_emotion_label TEXT;
ALTER TABLE public.moods ADD COLUMN IF NOT EXISTS mascot_sticker_id TEXT;
ALTER TABLE public.moods ADD COLUMN IF NOT EXISTS sleep_hours INTEGER;
ALTER TABLE public.moods ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.moods ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE public.moods ADD COLUMN IF NOT EXISTS local_date TEXT;
ALTER TABLE public.moods ADD CONSTRAINT moods_draft_v2_valid CHECK (
    draft_version IN (1, 2) AND (draft_version = 1 OR (
        intensity BETWEEN 1 AND 5
        AND (note IS NULL OR char_length(note) <= 60)
        AND (custom_emotion_label IS NULL OR char_length(custom_emotion_label) BETWEEN 1 AND 32)
        AND (sleep_hours IS NULL OR sleep_hours BETWEEN 2 AND 8)
        AND jsonb_typeof(attachments) = 'array' AND jsonb_array_length(attachments) <= 3
    ))
);
COMMIT;


-- Owner-only preferences. Run after reviewing against the development project.
BEGIN;
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
    timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    locale TEXT NOT NULL DEFAULT 'vi' CHECK (locale IN ('vi', 'en')),
    care_preferences JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (
        jsonb_typeof(care_preferences) = 'array' AND jsonb_array_length(care_preferences) <= 6
        AND care_preferences <@ '["encouragement", "voice", "photo", "call", "space", "gift"]'::jsonb),
    care_note TEXT NOT NULL DEFAULT '' CHECK (char_length(care_note) <= 140),
    partner_nickname TEXT NOT NULL DEFAULT '' CHECK (char_length(partner_nickname) <= 40),
    relationship_type TEXT CHECK (relationship_type IN ('long_distance', 'same_city')),
    onboarding_completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_preferences FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO service_role;
CREATE OR REPLACE FUNCTION public.sync_preferences_timezone() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
    UPDATE public.users SET timezone = NEW.timezone WHERE id = NEW.id;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS user_preferences_timezone ON public.user_preferences;
CREATE TRIGGER user_preferences_timezone AFTER INSERT OR UPDATE OF timezone
ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.sync_preferences_timezone();
COMMIT;
NOTIFY pgrst, 'reload schema';


-- Atomic state/rating changes. All identity arguments come from verified backend auth.
BEGIN;
CREATE OR REPLACE FUNCTION public.mutate_smart_nudge(
    p_nudge_id TEXT, p_user_id TEXT, p_action TEXT, p_version INTEGER DEFAULT NULL,
    p_rating TEXT DEFAULT NULL, p_feedback TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
    n public.smart_nudges%ROWTYPE;
    c public.couples%ROWTYPE;
    member_count INTEGER;
    rating_id TEXT;
BEGIN
    SELECT * INTO n FROM public.smart_nudges WHERE id = p_nudge_id FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('outcome', 'not_found'); END IF;
    SELECT * INTO c FROM public.couples WHERE id = n.couple_id FOR SHARE;
    IF NOT FOUND OR c.status <> 'active' OR n.receiver_id <> p_user_id
       OR p_user_id NOT IN (c.partner1_id, c.partner2_id) THEN
        RETURN jsonb_build_object('outcome', 'forbidden');
    END IF;
    PERFORM id FROM public.users WHERE id IN (c.partner1_id, c.partner2_id) ORDER BY id FOR SHARE;
    SELECT count(*) INTO member_count FROM public.users
      WHERE id IN (c.partner1_id, c.partner2_id) AND couple_id = c.id;
    IF member_count <> 2 THEN RETURN jsonb_build_object('outcome', 'forbidden'); END IF;
    IF p_action = 'rate' THEN
        IF p_rating NOT IN ('thumbs_up', 'thumbs_down') OR p_rating IS NULL
           OR char_length(coalesce(p_feedback, '')) > 200 THEN
            RETURN jsonb_build_object('outcome', 'invalid');
        END IF;
        -- Serialize by nudge row; preserve legacy records rather than delete data.
        SELECT id INTO rating_id FROM public.smart_nudge_ratings
          WHERE nudge_id = n.id AND user_id = p_user_id ORDER BY created_at DESC, id LIMIT 1;
        IF rating_id IS NULL THEN
            rating_id := 'rating:' || md5(n.id || ':' || p_user_id);
            INSERT INTO public.smart_nudge_ratings(id, nudge_id, user_id, rating, feedback_reason, created_at)
            VALUES(rating_id, n.id, p_user_id, p_rating, p_feedback, now()::text);
        ELSE
            UPDATE public.smart_nudge_ratings SET rating = p_rating, feedback_reason = p_feedback WHERE id = rating_id;
        END IF;
        RETURN jsonb_build_object('outcome', 'ok', 'nudge', to_jsonb(n));
    END IF;
    IF p_action NOT IN ('completed', 'dismissed', 'snoozed') OR p_action IS NULL THEN
        RETURN jsonb_build_object('outcome', 'invalid');
    END IF;
    IF n.status IN ('completed', 'dismissed') THEN
        IF n.status = p_action THEN RETURN jsonb_build_object('outcome', 'ok', 'nudge', to_jsonb(n)); END IF;
        RETURN jsonb_build_object('outcome', 'terminal');
    END IF;
    IF n.status = 'expired' OR (n.expires_at IS NOT NULL AND n.expires_at::timestamptz <= now()) THEN
        RETURN jsonb_build_object('outcome', 'expired');
    END IF;
    IF p_action = 'snoozed' AND p_version IS NOT NULL AND n.version = p_version + 1
       AND n.snooze_count = 1 AND n.snoozed_until::timestamptz > now() THEN
        RETURN jsonb_build_object('outcome', 'ok', 'nudge', to_jsonb(n));
    END IF;
    IF p_version IS NOT NULL AND p_version <> n.version THEN RETURN jsonb_build_object('outcome', 'conflict'); END IF;
    IF p_action = 'snoozed' AND n.snooze_count >= 1 THEN RETURN jsonb_build_object('outcome', 'snooze_limit'); END IF;
    UPDATE public.smart_nudges SET
      status = CASE WHEN p_action = 'snoozed' THEN 'new' ELSE p_action END,
      snoozed_until = CASE WHEN p_action = 'snoozed' THEN to_char((now() + interval '2 hours') AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') ELSE snoozed_until END,
      snooze_count = snooze_count + CASE WHEN p_action = 'snoozed' THEN 1 ELSE 0 END,
      version = version + 1
    WHERE id = n.id RETURNING * INTO n;
    RETURN jsonb_build_object('outcome', 'ok', 'nudge', to_jsonb(n));
END;
$$;
REVOKE ALL ON FUNCTION public.mutate_smart_nudge(TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mutate_smart_nudge(TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT) TO service_role;
COMMIT;
NOTIFY pgrst, 'reload schema';


-- Authoritative quota/cooldown and membership guard at insertion time.
BEGIN;
CREATE OR REPLACE FUNCTION public.create_smart_nudge_guarded(p_payload JSONB)
RETURNS JSONB LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
    n public.smart_nudges%ROWTYPE;
    c public.couples%ROWTYPE;
    local_zone TEXT;
    day_start TIMESTAMPTZ;
    latest_at TIMESTAMPTZ;
    day_count INTEGER;
    member_count INTEGER;
BEGIN
    n := jsonb_populate_record(NULL::public.smart_nudges, p_payload);
    SELECT * INTO c FROM public.couples WHERE id = n.couple_id FOR SHARE;
    IF NOT FOUND OR c.status <> 'active' OR n.receiver_id IS NULL
      OR n.receiver_id NOT IN (c.partner1_id, c.partner2_id) THEN
        RETURN jsonb_build_object('outcome', 'suppressed');
    END IF;
    PERFORM id FROM public.users WHERE id IN (c.partner1_id, c.partner2_id) ORDER BY id FOR SHARE;
    SELECT count(*) INTO member_count FROM public.users
      WHERE id IN (c.partner1_id, c.partner2_id) AND couple_id = c.id;
    IF member_count <> 2 OR n.partner_id IS NOT NULL AND (n.partner_id = n.receiver_id
        OR n.partner_id NOT IN (c.partner1_id, c.partner2_id)) THEN
        RETURN jsonb_build_object('outcome', 'suppressed');
    END IF;
    -- Serialize all generation attempts for this receiver/couple, including
    -- attempts which already performed provider work concurrently.
    PERFORM pg_advisory_xact_lock(hashtextextended(c.id || ':' || n.receiver_id, 0));
    SELECT timezone INTO local_zone FROM public.users WHERE id = n.receiver_id;
    IF local_zone IS NULL OR NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = local_zone) THEN
        local_zone := 'UTC';
    END IF;
    day_start := date_trunc('day', now() AT TIME ZONE local_zone) AT TIME ZONE local_zone;
    SELECT count(*), max(created_at::timestamptz) INTO day_count, latest_at FROM public.smart_nudges
      WHERE couple_id = c.id AND receiver_id = n.receiver_id AND created_at::timestamptz >= day_start;
    IF day_count >= 3 THEN RETURN jsonb_build_object('outcome', 'suppressed'); END IF;
    SELECT max(created_at::timestamptz) INTO latest_at FROM public.smart_nudges
      WHERE couple_id = c.id AND receiver_id = n.receiver_id;
    IF latest_at IS NOT NULL AND latest_at > now() - interval '4 hours' THEN
        RETURN jsonb_build_object('outcome', 'suppressed');
    END IF;
    n.created_at := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"');
    n.expires_at := to_char((now() + interval '24 hours') AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"');
    n.status := 'new'; n.version := 1; n.snooze_count := 0; n.snoozed_until := NULL;
    INSERT INTO public.smart_nudges SELECT n.* RETURNING * INTO n;
    RETURN jsonb_build_object('outcome', 'created', 'nudge', to_jsonb(n));
END;
$$;
REVOKE ALL ON FUNCTION public.create_smart_nudge_guarded(JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_smart_nudge_guarded(JSONB) TO service_role;
COMMIT;
NOTIFY pgrst, 'reload schema';


-- Ending a connection retains records; purge/export jobs are a separate rollout.
BEGIN;
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS dissolved_at TIMESTAMPTZ;
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS purge_after TIMESTAMPTZ;
CREATE OR REPLACE FUNCTION public.dissolve_couple(p_user_id TEXT, p_couple_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
    c public.couples%ROWTYPE;
    owner_pair TEXT;
BEGIN
    SELECT * INTO c FROM public.couples WHERE id = p_couple_id FOR UPDATE;
    IF NOT FOUND OR (p_user_id IS DISTINCT FROM c.partner1_id AND p_user_id IS DISTINCT FROM c.partner2_id) THEN
        RETURN jsonb_build_object('outcome', 'forbidden');
    END IF;
    IF c.status = 'dissolved' AND c.dissolved_at IS NOT NULL THEN
        RETURN jsonb_build_object('outcome', 'dissolved', 'couple_id', c.id,
          'status', c.status, 'dissolved_at', c.dissolved_at, 'purge_after', c.purge_after);
    END IF;
    IF c.status <> 'active' THEN RETURN jsonb_build_object('outcome', 'conflict'); END IF;
    -- Match accept_invite's invite-before-user lock order.
    PERFORM id FROM public.invite_codes WHERE user_id IN (c.partner1_id, c.partner2_id)
      AND status = 'pending' ORDER BY id FOR UPDATE;
    PERFORM id FROM public.users WHERE id IN (c.partner1_id, c.partner2_id) ORDER BY id FOR UPDATE;
    SELECT couple_id INTO owner_pair FROM public.users WHERE id = p_user_id;
    IF owner_pair IS DISTINCT FROM c.id THEN RETURN jsonb_build_object('outcome', 'forbidden'); END IF;
    UPDATE public.couples SET status = 'dissolved', dissolved_at = now(),
      purge_after = now() + interval '30 days', updated_at = now()::text
      WHERE id = c.id RETURNING * INTO c;
    -- A stale retry is bound to c.id and cannot detach a later connection.
    UPDATE public.users SET couple_id = NULL, updated_at = now()::text
      WHERE id IN (c.partner1_id, c.partner2_id) AND couple_id = c.id;
    UPDATE public.invite_codes SET status = 'cancelled'
      WHERE user_id IN (c.partner1_id, c.partner2_id) AND status = 'pending';
    RETURN jsonb_build_object('outcome', 'dissolved', 'couple_id', c.id,
      'status', c.status, 'dissolved_at', c.dissolved_at, 'purge_after', c.purge_after);
END;
$$;
REVOKE ALL ON FUNCTION public.dissolve_couple(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dissolve_couple(TEXT, TEXT) TO service_role;
COMMIT;
NOTIFY pgrst, 'reload schema';


BEGIN;
ALTER TABLE public.tiny_moments ADD COLUMN IF NOT EXISTS reply_to TEXT REFERENCES public.tiny_moments(id);
ALTER TABLE public.tiny_moments ADD COLUMN IF NOT EXISTS media_id TEXT;
ALTER TABLE public.tiny_moments ADD COLUMN IF NOT EXISTS request_fingerprint TEXT;
ALTER TABLE public.tiny_moments ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE public.tiny_moments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.tiny_moments ADD COLUMN IF NOT EXISTS place TEXT CHECK(char_length(place)<=80);
UPDATE public.tiny_moments m SET receiver_id=CASE WHEN m.sender_id=c.partner1_id THEN c.partner2_id ELSE c.partner1_id END
FROM public.couples c WHERE m.couple_id=c.id AND m.receiver_id IS NULL AND m.sender_id IN(c.partner1_id,c.partner2_id);
CREATE TABLE IF NOT EXISTS public.tiny_moment_media (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES public.users(id),
    couple_id TEXT NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK(kind IN ('photo', 'voice')),
    storage_path TEXT NOT NULL UNIQUE,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL CHECK(size_bytes BETWEEN 1 AND 2097152),
    duration_seconds DOUBLE PRECISION,
    claimed_by TEXT,
    fingerprint TEXT NOT NULL,
    discarded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK(kind <> 'voice' OR duration_seconds IS NOT NULL AND duration_seconds > 0 AND duration_seconds <= 30)
);
ALTER TABLE public.tiny_moment_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiny_moment_media ADD COLUMN IF NOT EXISTS fingerprint TEXT;
ALTER TABLE public.tiny_moment_media ADD COLUMN IF NOT EXISTS discarded_at TIMESTAMPTZ;
REVOKE ALL ON public.tiny_moment_media FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tiny_moment_media TO service_role;
CREATE OR REPLACE FUNCTION public.mutate_tiny_moment(p_user_id TEXT, p_couple_id TEXT,
    p_moment_id TEXT, p_action TEXT, p_payload JSONB DEFAULT '{}'::jsonb)
RETURNS JSONB LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
    c public.couples%ROWTYPE;
    m public.tiny_moments%ROWTYPE;
    asset public.tiny_moment_media%ROWTYPE;
    member_count INTEGER;
    receiver TEXT;
    target_type TEXT;
    text_value TEXT;
    nudge TEXT;
    reply TEXT;
    media TEXT;
BEGIN
    SELECT * INTO c FROM public.couples WHERE id = p_couple_id FOR SHARE;
    IF NOT FOUND OR c.status <> 'active' OR (p_user_id IS DISTINCT FROM c.partner1_id AND p_user_id IS DISTINCT FROM c.partner2_id) THEN
        RETURN jsonb_build_object('outcome', 'forbidden');
    END IF;
    PERFORM id FROM public.users WHERE id IN(c.partner1_id,c.partner2_id) ORDER BY id FOR SHARE;
    SELECT count(*) INTO member_count FROM public.users WHERE id IN(c.partner1_id,c.partner2_id) AND couple_id=c.id;
    IF member_count<>2 THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended('moment:'||p_moment_id,0));
    SELECT * INTO m FROM public.tiny_moments WHERE id=p_moment_id FOR UPDATE;
    IF FOUND THEN
        IF m.couple_id<>c.id OR (p_user_id IS DISTINCT FROM m.sender_id AND p_user_id IS DISTINCT FROM m.receiver_id) THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
        IF p_action='delete' AND p_user_id=m.sender_id AND m.deleted_at IS NOT NULL THEN
            RETURN jsonb_build_object('outcome','ok','moment',to_jsonb(m));
        END IF;
        IF m.deleted_at IS NOT NULL THEN RETURN jsonb_build_object('outcome','not_found'); END IF;
        IF p_action='create' THEN
            IF m.sender_id<>p_user_id OR m.request_fingerprint IS DISTINCT FROM p_payload->>'fingerprint' THEN
                RETURN jsonb_build_object('outcome','conflict');
            END IF;
        ELSIF p_action='delete' THEN
            IF m.sender_id<>p_user_id THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
            UPDATE public.tiny_moments SET content=NULL, reaction=NULL, deleted_at=now() WHERE id=m.id RETURNING * INTO m;
        ELSIF p_action IN('read','react') THEN
            IF m.receiver_id IS DISTINCT FROM p_user_id THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
            IF p_action='read' THEN
                UPDATE public.tiny_moments SET read_at=coalesce(read_at,now()) WHERE id=m.id RETURNING * INTO m;
            ELSE
                IF p_payload->>'reaction' IS NOT NULL AND p_payload->>'reaction' NOT IN('heart','hug','smile','thanks') THEN
                    RETURN jsonb_build_object('outcome','conflict');
                END IF;
                UPDATE public.tiny_moments SET reaction=p_payload->>'reaction' WHERE id=m.id RETURNING * INTO m;
            END IF;
        ELSIF p_action<>'get' THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
        RETURN jsonb_build_object('outcome','ok','moment',to_jsonb(m));
    END IF;
    IF p_action<>'create' THEN RETURN jsonb_build_object('outcome','not_found'); END IF;
    target_type:=p_payload->>'moment_type'; text_value:=p_payload->>'content';
    nudge:=p_payload->>'nudge_id'; reply:=p_payload->>'reply_to'; media:=p_payload->>'media_id';
    receiver:=CASE WHEN c.partner1_id=p_user_id THEN c.partner2_id ELSE c.partner1_id END;
    IF target_type NOT IN('text','signal','photo','voice') OR target_type IS NULL
       OR char_length(coalesce(text_value,''))>200 THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
    IF nudge IS NOT NULL THEN
        PERFORM id FROM public.smart_nudges WHERE id=nudge AND couple_id=c.id AND receiver_id=p_user_id
          AND status='new' AND (expires_at IS NULL OR expires_at::timestamptz>now()) FOR UPDATE;
        IF NOT FOUND THEN RETURN jsonb_build_object('outcome','not_found'); END IF;
    END IF;
    IF reply IS NOT NULL THEN
        -- Lock the parent so a concurrent sender deletion cannot race this reply.
        PERFORM id FROM public.tiny_moments WHERE id=reply AND couple_id=c.id AND deleted_at IS NULL FOR SHARE;
        IF NOT FOUND THEN RETURN jsonb_build_object('outcome','not_found'); END IF;
    END IF;
    IF target_type IN('photo','voice') THEN
        SELECT * INTO asset FROM public.tiny_moment_media WHERE id=media FOR UPDATE;
        IF NOT FOUND OR asset.owner_id<>p_user_id OR asset.couple_id<>c.id OR asset.kind<>target_type
          OR asset.claimed_by IS NOT NULL OR asset.discarded_at IS NOT NULL OR char_length(coalesce(text_value,''))>100 THEN
            RETURN jsonb_build_object('outcome','not_found');
        END IF;
    ELSIF media IS NOT NULL OR target_type='text' AND btrim(coalesce(text_value,''))=''
       OR target_type='signal' AND (text_value IS NULL OR text_value NOT IN('miss_you','thinking_of_you','good_night')) THEN
        RETURN jsonb_build_object('outcome','conflict');
    END IF;
    INSERT INTO public.tiny_moments(id,couple_id,sender_id,receiver_id,moment_type,content,nudge_id,reply_to,media_id,place,request_fingerprint,created_at)
    VALUES(p_moment_id,c.id,p_user_id,receiver,target_type,text_value,nudge,reply,media,p_payload->>'place',p_payload->>'fingerprint',
       to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) RETURNING * INTO m;
    IF media IS NOT NULL THEN UPDATE public.tiny_moment_media SET claimed_by=m.id WHERE id=media; END IF;
    IF nudge IS NOT NULL THEN UPDATE public.smart_nudges SET status='completed',version=version+1 WHERE id=nudge; END IF;
    RETURN jsonb_build_object('outcome','ok','moment',to_jsonb(m));
END;
$$;
REVOKE ALL ON FUNCTION public.mutate_tiny_moment(TEXT,TEXT,TEXT,TEXT,JSONB) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mutate_tiny_moment(TEXT,TEXT,TEXT,TEXT,JSONB) TO service_role;
COMMIT;
NOTIFY pgrst, 'reload schema';

BEGIN;
CREATE OR REPLACE FUNCTION public.discard_tiny_moment_media(p_user_id TEXT,p_media_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SET search_path=public AS $$
DECLARE asset public.tiny_moment_media%ROWTYPE;
BEGIN
    SELECT * INTO asset FROM public.tiny_moment_media WHERE id=p_media_id FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('outcome','missing'); END IF;
    IF asset.owner_id<>p_user_id OR asset.claimed_by IS NOT NULL THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
    UPDATE public.tiny_moment_media SET discarded_at=coalesce(discarded_at,now()) WHERE id=asset.id RETURNING * INTO asset;
    RETURN jsonb_build_object('outcome','ok','media',to_jsonb(asset));
END;
$$;
REVOKE ALL ON FUNCTION public.discard_tiny_moment_media(TEXT,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.discard_tiny_moment_media(TEXT,TEXT) TO service_role;
COMMIT;

-- Align Nudge lock order with Moment and retained-couple transactions.
-- Atomic state/rating changes. All identity arguments come from verified backend auth.
BEGIN;
CREATE OR REPLACE FUNCTION public.mutate_smart_nudge(
    p_nudge_id TEXT, p_user_id TEXT, p_action TEXT, p_version INTEGER DEFAULT NULL,
    p_rating TEXT DEFAULT NULL, p_feedback TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
    n public.smart_nudges%ROWTYPE;
    c public.couples%ROWTYPE;
    member_count INTEGER;
    rating_id TEXT;
BEGIN
    SELECT * INTO n FROM public.smart_nudges WHERE id = p_nudge_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('outcome', 'not_found'); END IF;
    SELECT * INTO c FROM public.couples WHERE id = n.couple_id FOR SHARE;
    IF NOT FOUND OR c.status <> 'active' OR n.receiver_id <> p_user_id
       OR p_user_id NOT IN (c.partner1_id, c.partner2_id) THEN
        RETURN jsonb_build_object('outcome', 'forbidden');
    END IF;
    PERFORM id FROM public.users WHERE id IN (c.partner1_id, c.partner2_id) ORDER BY id FOR SHARE;
    SELECT count(*) INTO member_count FROM public.users
      WHERE id IN (c.partner1_id, c.partner2_id) AND couple_id = c.id;
    IF member_count <> 2 THEN RETURN jsonb_build_object('outcome', 'forbidden'); END IF;
    -- Keep couple/member-before-entity lock order shared by Moment/dissolve.
    SELECT * INTO n FROM public.smart_nudges WHERE id = p_nudge_id FOR UPDATE;
    IF NOT FOUND OR n.couple_id <> c.id THEN RETURN jsonb_build_object('outcome', 'not_found'); END IF;
    IF p_action = 'rate' THEN
        IF p_rating NOT IN ('thumbs_up', 'thumbs_down') OR p_rating IS NULL
           OR char_length(coalesce(p_feedback, '')) > 200 THEN
            RETURN jsonb_build_object('outcome', 'invalid');
        END IF;
        -- Serialize by nudge row; preserve legacy records rather than delete data.
        SELECT id INTO rating_id FROM public.smart_nudge_ratings
          WHERE nudge_id = n.id AND user_id = p_user_id ORDER BY created_at DESC, id LIMIT 1;
        IF rating_id IS NULL THEN
            rating_id := 'rating:' || md5(n.id || ':' || p_user_id);
            INSERT INTO public.smart_nudge_ratings(id, nudge_id, user_id, rating, feedback_reason, created_at)
            VALUES(rating_id, n.id, p_user_id, p_rating, p_feedback, now()::text);
        ELSE
            UPDATE public.smart_nudge_ratings SET rating = p_rating, feedback_reason = p_feedback WHERE id = rating_id;
        END IF;
        RETURN jsonb_build_object('outcome', 'ok', 'nudge', to_jsonb(n));
    END IF;
    IF p_action NOT IN ('completed', 'dismissed', 'snoozed') OR p_action IS NULL THEN
        RETURN jsonb_build_object('outcome', 'invalid');
    END IF;
    IF n.status IN ('completed', 'dismissed') THEN
        IF n.status = p_action THEN RETURN jsonb_build_object('outcome', 'ok', 'nudge', to_jsonb(n)); END IF;
        RETURN jsonb_build_object('outcome', 'terminal');
    END IF;
    IF n.status = 'expired' OR (n.expires_at IS NOT NULL AND n.expires_at::timestamptz <= now()) THEN
        RETURN jsonb_build_object('outcome', 'expired');
    END IF;
    IF p_action = 'snoozed' AND p_version IS NOT NULL AND n.version = p_version + 1
       AND n.snooze_count = 1 AND n.snoozed_until::timestamptz > now() THEN
        RETURN jsonb_build_object('outcome', 'ok', 'nudge', to_jsonb(n));
    END IF;
    IF p_version IS NOT NULL AND p_version <> n.version THEN RETURN jsonb_build_object('outcome', 'conflict'); END IF;
    IF p_action = 'snoozed' AND n.snooze_count >= 1 THEN RETURN jsonb_build_object('outcome', 'snooze_limit'); END IF;
    UPDATE public.smart_nudges SET
      status = CASE WHEN p_action = 'snoozed' THEN 'new' ELSE p_action END,
      snoozed_until = CASE WHEN p_action = 'snoozed' THEN to_char((now() + interval '2 hours') AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') ELSE snoozed_until END,
      snooze_count = snooze_count + CASE WHEN p_action = 'snoozed' THEN 1 ELSE 0 END,
      version = version + 1
    WHERE id = n.id RETURNING * INTO n;
    RETURN jsonb_build_object('outcome', 'ok', 'nudge', to_jsonb(n));
END;
$$;
REVOKE ALL ON FUNCTION public.mutate_smart_nudge(TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mutate_smart_nudge(TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT) TO service_role;
COMMIT;
NOTIFY pgrst, 'reload schema';

-- Durable Tiny Moment upload reservations, 20261110.
-- Run after 20261110_private_tiny_moments.sql. No content or legacy rows removed.
BEGIN;
-- Old rows were inserted only after PUT success; retain their ready status.
ALTER TABLE public.tiny_moment_media ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ DEFAULT now();

CREATE OR REPLACE FUNCTION public.finalize_tiny_moment_media(p_user_id TEXT,p_media_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SET search_path=public AS $$
DECLARE a public.tiny_moment_media%ROWTYPE; c public.couples%ROWTYPE; members INTEGER;
BEGIN
    SELECT * INTO a FROM public.tiny_moment_media WHERE id=p_media_id;
    IF NOT FOUND OR a.owner_id<>p_user_id THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
    SELECT * INTO c FROM public.couples WHERE id=a.couple_id FOR SHARE;
    IF NOT FOUND OR c.status<>'active' OR (p_user_id IS DISTINCT FROM c.partner1_id AND p_user_id IS DISTINCT FROM c.partner2_id) THEN
        RETURN jsonb_build_object('outcome','forbidden');
    END IF;
    PERFORM id FROM public.users WHERE id IN(c.partner1_id,c.partner2_id) ORDER BY id FOR SHARE;
    SELECT count(*) INTO members FROM public.users WHERE id IN(c.partner1_id,c.partner2_id) AND couple_id=c.id;
    IF members<>2 THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
    SELECT * INTO a FROM public.tiny_moment_media WHERE id=p_media_id FOR UPDATE;
    IF NOT FOUND OR a.owner_id<>p_user_id OR a.couple_id<>c.id OR a.discarded_at IS NOT NULL THEN
        RETURN jsonb_build_object('outcome','conflict');
    END IF;
    UPDATE public.tiny_moment_media SET ready_at=coalesce(ready_at,now()) WHERE id=a.id RETURNING * INTO a;
    RETURN jsonb_build_object('outcome','ok','media',to_jsonb(a));
END;
$$;
REVOKE ALL ON FUNCTION public.finalize_tiny_moment_media(TEXT,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_tiny_moment_media(TEXT,TEXT) TO service_role;

-- Backstop the existing create RPC: reserved assets cannot be attached before
-- storage acknowledgement, even by concurrent or directly issued SQL requests.
CREATE OR REPLACE FUNCTION public.require_ready_tiny_moment_media() RETURNS trigger
LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
    IF NEW.media_id IS NOT NULL THEN
        PERFORM id FROM public.tiny_moment_media WHERE id=NEW.media_id AND ready_at IS NOT NULL AND discarded_at IS NULL FOR SHARE;
        IF NOT FOUND THEN RAISE EXCEPTION 'Moment media unavailable' USING ERRCODE='23514'; END IF;
    END IF;
    RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.require_ready_tiny_moment_media() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.require_ready_tiny_moment_media() TO service_role;
DROP TRIGGER IF EXISTS tiny_moment_media_ready ON public.tiny_moments;
CREATE TRIGGER tiny_moment_media_ready BEFORE INSERT OR UPDATE OF media_id ON public.tiny_moments
FOR EACH ROW EXECUTE FUNCTION public.require_ready_tiny_moment_media();
COMMIT;
NOTIFY pgrst, 'reload schema';

-- Bootstrap module: 20261110_missions.sql
-- Real daily assignments and immutable points. No physical rewards are seeded.
BEGIN;
CREATE TABLE IF NOT EXISTS public.mission_rules(
 version INTEGER PRIMARY KEY CHECK(version>0), active BOOLEAN NOT NULL DEFAULT true,
 individual_points INTEGER NOT NULL CHECK(individual_points BETWEEN 1 AND 100),
 shared_points INTEGER NOT NULL CHECK(shared_points BETWEEN 1 AND 200),
 weekly_target INTEGER NOT NULL CHECK(weekly_target BETWEEN 1 AND 28),
 weekly_bonus INTEGER NOT NULL CHECK(weekly_bonus BETWEEN 0 AND 1000),
 monthly_target INTEGER NOT NULL CHECK(monthly_target BETWEEN 1 AND 124),
 monthly_bonus INTEGER NOT NULL CHECK(monthly_bonus BETWEEN 0 AND 5000),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.mission_rules(version,individual_points,shared_points,weekly_target,weekly_bonus,monthly_target,monthly_bonus)
 VALUES(1,10,20,16,20,80,100) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS public.mission_templates(
 id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN('individual','shared')),
 title_vi TEXT NOT NULL, title_en TEXT NOT NULL, description_vi TEXT NOT NULL,
 description_en TEXT NOT NULL, active BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO public.mission_templates(id,kind,title_vi,title_en,description_vi,description_en) VALUES
 ('individual-water','individual','Một cốc nước cho mình','A glass of water','Dành một phút nghỉ và uống một cốc nước.','Take a short break and drink a glass of water.'),
 ('individual-rest','individual','Nghỉ mắt một chút','Rest your eyes','Rời màn hình và nhìn ra xa trong một phút.','Step away from the screen and look into the distance for a minute.'),
 ('individual-thanks','individual','Một lời cảm ơn','A word of thanks','Nói với người ấy một điều bạn biết ơn hôm nay.','Tell your partner one thing you appreciate today.'),
 ('individual-kindness','individual','Một điều tử tế','A kind act','Làm một việc nhỏ tử tế cho chính mình hôm nay.','Do one small kind thing for yourself today.'),
 ('shared-good','shared','Điều vui trong ngày','Something good today','Mỗi người kể một điều vui trong ngày của mình.','Each person shares one good thing from their day.'),
 ('shared-listen','shared','Lắng nghe nhau','Listen to each other','Mỗi người dành hai phút lắng nghe người kia.','Each person spends two minutes listening to the other.'),
 ('shared-memory','shared','Nhắc một kỷ niệm','Remember a moment','Mỗi người nhắc lại một kỷ niệm chung mà mình thích.','Each person recalls a shared memory they enjoy.'),
 ('shared-plan','shared','Một kế hoạch nhỏ','A small plan','Cùng chọn một hoạt động nhỏ muốn làm với nhau.','Choose one small activity you would like to do together.')
 ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS public.mission_wallets(
 couple_id TEXT PRIMARY KEY REFERENCES public.couples(id), balance BIGINT NOT NULL DEFAULT 0 CHECK(balance>=0),
 revision INTEGER NOT NULL DEFAULT 0, timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
 pending_timezone TEXT, timezone_effective_at TIMESTAMPTZ,
 rule_version INTEGER NOT NULL DEFAULT 1 REFERENCES public.mission_rules(version), rule_week DATE,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.mission_assignments(
 id TEXT PRIMARY KEY, couple_id TEXT NOT NULL REFERENCES public.couples(id), local_date DATE NOT NULL,
 slot INTEGER NOT NULL CHECK(slot BETWEEN 1 AND 4), kind TEXT NOT NULL CHECK(kind IN('individual','shared')),
 assignee_id TEXT REFERENCES public.users(id), template_id TEXT NOT NULL REFERENCES public.mission_templates(id),
 title_vi TEXT NOT NULL,title_en TEXT NOT NULL,description_vi TEXT NOT NULL,description_en TEXT NOT NULL,
 points INTEGER NOT NULL CHECK(points>0),rule_version INTEGER NOT NULL REFERENCES public.mission_rules(version),
 version INTEGER NOT NULL DEFAULT 0 CHECK(version BETWEEN 0 AND 1),
 awarded_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(couple_id,local_date,slot), CHECK((kind='individual')=(assignee_id IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS public.mission_completions(
 assignment_id TEXT NOT NULL REFERENCES public.mission_assignments(id),user_id TEXT NOT NULL REFERENCES public.users(id),
 completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),PRIMARY KEY(assignment_id,user_id)
);
CREATE TABLE IF NOT EXISTS public.mission_ledger(
 id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,couple_id TEXT NOT NULL REFERENCES public.couples(id),
 delta BIGINT NOT NULL CHECK(delta<>0),source_kind TEXT NOT NULL,source_id TEXT NOT NULL,
 rule_version INTEGER REFERENCES public.mission_rules(version),created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(couple_id,source_kind,source_id)
);
CREATE TABLE IF NOT EXISTS public.mission_periods(
 couple_id TEXT NOT NULL REFERENCES public.couples(id),kind TEXT NOT NULL CHECK(kind IN('week','month')),
 start_date DATE NOT NULL,end_date DATE NOT NULL,target INTEGER NOT NULL CHECK(target>0),
 bonus INTEGER NOT NULL CHECK(bonus>=0),rule_version INTEGER NOT NULL REFERENCES public.mission_rules(version),
 credited_at TIMESTAMPTZ,PRIMARY KEY(couple_id,kind,start_date)
);
CREATE TABLE IF NOT EXISTS public.mission_requests(
 actor_id TEXT NOT NULL REFERENCES public.users(id),action TEXT NOT NULL,request_key TEXT NOT NULL,
 target_id TEXT,payload_hash TEXT NOT NULL,couple_id TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(actor_id,action,request_key)
);
CREATE TABLE IF NOT EXISTS public.mission_operators(user_id TEXT PRIMARY KEY REFERENCES public.users(id),active BOOLEAN NOT NULL DEFAULT true);
CREATE INDEX IF NOT EXISTS mission_assignment_period ON public.mission_assignments(couple_id,local_date) WHERE awarded_at IS NOT NULL;
DO $$ DECLARE t TEXT; BEGIN
 FOREACH t IN ARRAY ARRAY['mission_rules','mission_templates','mission_wallets','mission_assignments','mission_completions','mission_ledger','mission_periods','mission_requests','mission_operators'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM anon,authenticated',t);
  EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO service_role',t);
 END LOOP;
END $$;

REVOKE UPDATE,DELETE ON public.mission_ledger FROM service_role;

CREATE OR REPLACE FUNCTION public.mission_pair(p_user TEXT) RETURNS TEXT LANGUAGE plpgsql SET search_path=public AS $$
DECLARE pair TEXT;c public.couples%ROWTYPE;members INTEGER;
BEGIN
 SELECT couple_id INTO pair FROM public.users WHERE id=p_user;
 SELECT * INTO c FROM public.couples WHERE id=pair FOR UPDATE;
 IF NOT FOUND OR c.status<>'active' OR (p_user IS DISTINCT FROM c.partner1_id AND p_user IS DISTINCT FROM c.partner2_id) THEN RETURN NULL; END IF;
 PERFORM id FROM public.users WHERE id IN(c.partner1_id,c.partner2_id) ORDER BY id FOR SHARE;
 SELECT count(*) INTO members FROM public.users WHERE id IN(c.partner1_id,c.partner2_id) AND couple_id=c.id;
 RETURN CASE WHEN members=2 THEN c.id ELSE NULL END;
END $$;
CREATE OR REPLACE FUNCTION public.mission_assignment_view(p_id TEXT) RETURNS JSONB LANGUAGE sql SET search_path=public AS $$
 SELECT to_jsonb(a)||jsonb_build_object('completed_by',coalesce((SELECT jsonb_agg(user_id ORDER BY user_id) FROM public.mission_completions WHERE assignment_id=a.id),'[]'::jsonb))
 FROM public.mission_assignments a WHERE a.id=p_id
$$;
CREATE OR REPLACE FUNCTION public.mission_credit(p_pair TEXT,p_delta BIGINT,p_kind TEXT,p_source TEXT,p_rule INTEGER DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SET search_path=public AS $$
DECLARE inserted INTEGER;
BEGIN
 INSERT INTO public.mission_ledger(couple_id,delta,source_kind,source_id,rule_version) VALUES(p_pair,p_delta,p_kind,p_source,p_rule) ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS inserted=ROW_COUNT;
 IF inserted=1 THEN UPDATE public.mission_wallets SET balance=balance+p_delta,revision=revision+1,updated_at=now() WHERE couple_id=p_pair; END IF;
 RETURN inserted=1;
END $$;
CREATE OR REPLACE FUNCTION public.mission_bonus(p_pair TEXT,p_day DATE) RETURNS VOID LANGUAGE plpgsql SET search_path=public AS $$
DECLARE r public.mission_rules%ROWTYPE;p public.mission_periods%ROWTYPE;amount INTEGER;week DATE;month DATE;
BEGIN
 SELECT rules.* INTO r FROM public.mission_rules rules JOIN public.mission_wallets w ON w.rule_version=rules.version WHERE w.couple_id=p_pair;
 week=date_trunc('week',p_day::timestamp)::date;month=date_trunc('month',p_day::timestamp)::date;
 INSERT INTO public.mission_periods VALUES(p_pair,'week',week,week+7,r.weekly_target,r.weekly_bonus,r.version,NULL) ON CONFLICT DO NOTHING;
 INSERT INTO public.mission_periods VALUES(p_pair,'month',month,(month+interval '1 month')::date,r.monthly_target,r.monthly_bonus,r.version,NULL) ON CONFLICT DO NOTHING;
 FOR p IN SELECT * FROM public.mission_periods WHERE couple_id=p_pair AND start_date<=p_day AND end_date>p_day AND credited_at IS NULL FOR UPDATE LOOP
  SELECT count(*) INTO amount FROM public.mission_assignments WHERE couple_id=p_pair AND local_date>=p.start_date AND local_date<p.end_date AND awarded_at IS NOT NULL;
  IF amount>=p.target THEN
   IF p.bonus>0 THEN PERFORM public.mission_credit(p_pair,p.bonus,'bonus',p.kind||':'||p.start_date::text,p.rule_version); END IF;
   UPDATE public.mission_periods SET credited_at=now() WHERE couple_id=p_pair AND kind=p.kind AND start_date=p.start_date;
  END IF;
 END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.mission_operation(p_user TEXT,p_action TEXT,p_target TEXT DEFAULT NULL,p_key TEXT DEFAULT NULL,p_payload JSONB DEFAULT '{}'::jsonb)
RETURNS JSONB LANGUAGE plpgsql SET search_path=public AS $$
DECLARE pair TEXT;wallet public.mission_wallets%ROWTYPE;c public.couples%ROWTYPE;r public.mission_rules%ROWTYPE;
 a public.mission_assignments%ROWTYPE;t public.mission_templates%ROWTYPE;req public.mission_requests%ROWTYPE;
 day DATE;week DATE;v_slot INTEGER;required INTEGER;done INTEGER;ids TEXT[];result JSONB;fingerprint TEXT;new_zone TEXT;
BEGIN
 IF p_action IN('complete','swap','timezone') THEN
  IF p_key IS NULL OR char_length(p_key) NOT BETWEEN 1 AND 120 THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('mission:'||p_user||':'||p_action||':'||p_key,0));
 END IF;
 pair=public.mission_pair(p_user);
 IF pair IS NULL THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
 SELECT * INTO c FROM public.couples WHERE id=pair;
 INSERT INTO public.mission_wallets(couple_id) VALUES(pair) ON CONFLICT DO NOTHING;
 SELECT * INTO wallet FROM public.mission_wallets WHERE couple_id=pair FOR UPDATE;
 IF wallet.timezone_effective_at<=now() THEN
  UPDATE public.mission_wallets SET timezone=pending_timezone,pending_timezone=NULL,timezone_effective_at=NULL WHERE couple_id=pair RETURNING * INTO wallet;
 END IF;
 day=(now() AT TIME ZONE wallet.timezone)::date;week=date_trunc('week',day::timestamp)::date;
 IF wallet.rule_week IS DISTINCT FROM week THEN
  SELECT * INTO r FROM public.mission_rules WHERE active ORDER BY version DESC LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('outcome','unavailable'); END IF;
  UPDATE public.mission_wallets SET rule_version=r.version,rule_week=week WHERE couple_id=pair RETURNING * INTO wallet;
 ELSE SELECT * INTO r FROM public.mission_rules WHERE version=wallet.rule_version; END IF;
 fingerprint=md5(coalesce(p_target,'')||p_payload::text);
 IF p_key IS NOT NULL THEN
  SELECT * INTO req FROM public.mission_requests WHERE actor_id=p_user AND action=p_action AND request_key=p_key;
  IF FOUND THEN
   IF req.couple_id<>pair OR req.target_id IS DISTINCT FROM p_target OR req.payload_hash<>fingerprint THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
   IF p_action IN('complete','swap') THEN RETURN jsonb_build_object('outcome','ok','data',public.mission_assignment_view(p_target)); END IF;
   RETURN jsonb_build_object('outcome','ok','data',to_jsonb(wallet));
  END IF;
 END IF;
 IF p_action='timezone' THEN
  new_zone=p_payload->>'timezone';
  IF NOT EXISTS(SELECT 1 FROM pg_timezone_names WHERE name=new_zone) THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
  UPDATE public.mission_wallets SET pending_timezone=new_zone,
   timezone_effective_at=(date_trunc('week',now() AT TIME ZONE new_zone)+interval '7 days') AT TIME ZONE new_zone
   WHERE couple_id=pair RETURNING * INTO wallet;
  INSERT INTO public.mission_requests(actor_id,action,request_key,target_id,payload_hash,couple_id) VALUES(p_user,p_action,p_key,p_target,fingerprint,pair);
  RETURN jsonb_build_object('outcome','ok','data',to_jsonb(wallet));
 ELSIF p_action='wallet' THEN RETURN jsonb_build_object('outcome','ok','data',to_jsonb(wallet));
 ELSIF p_action='ledger' THEN
  SELECT coalesce(jsonb_agg(to_jsonb(l)),'[]') INTO result FROM(SELECT * FROM public.mission_ledger WHERE couple_id=pair ORDER BY created_at DESC,id DESC LIMIT least(100,greatest(1,coalesce((p_payload->>'limit')::int,20))) OFFSET greatest(0,coalesce((p_payload->>'offset')::int,0))) l;
  RETURN jsonb_build_object('outcome','ok','data',result);
 END IF;
 IF p_action IN('today','achievements') THEN
  IF (SELECT count(*) FROM public.mission_templates WHERE active AND kind='individual')<2 OR (SELECT count(*) FROM public.mission_templates WHERE active AND kind='shared')<2 THEN RETURN jsonb_build_object('outcome','unavailable'); END IF;
  FOR v_slot IN 1..4 LOOP
   IF EXISTS(SELECT 1 FROM public.mission_assignments m WHERE m.couple_id=pair AND m.local_date=day AND m.slot=v_slot) THEN CONTINUE; END IF;
   SELECT array_agg(m.template_id) INTO ids FROM public.mission_assignments m WHERE m.couple_id=pair AND m.local_date=day;
   SELECT * INTO t FROM public.mission_templates WHERE active AND kind=CASE WHEN v_slot<=2 THEN 'individual' ELSE 'shared' END AND NOT(id=ANY(coalesce(ids,ARRAY[]::text[]))) ORDER BY md5(pair||day::text||id) LIMIT 1;
   INSERT INTO public.mission_assignments(id,couple_id,local_date,slot,kind,assignee_id,template_id,title_vi,title_en,description_vi,description_en,points,rule_version)
    VALUES(md5(pair||':'||day::text||':'||v_slot),pair,day,v_slot,t.kind,CASE v_slot WHEN 1 THEN c.partner1_id WHEN 2 THEN c.partner2_id ELSE NULL END,t.id,t.title_vi,t.title_en,t.description_vi,t.description_en,CASE WHEN v_slot<=2 THEN r.individual_points ELSE r.shared_points END,r.version);
  END LOOP;
  PERFORM public.mission_bonus(pair,day);
  IF p_action='achievements' THEN
   SELECT coalesce(jsonb_agg(to_jsonb(p)||jsonb_build_object('completed_count',(SELECT count(*) FROM public.mission_assignments m WHERE m.couple_id=pair AND m.local_date>=p.start_date AND m.local_date<p.end_date AND m.awarded_at IS NOT NULL)) ORDER BY start_date DESC,kind),'[]') INTO result FROM public.mission_periods p WHERE couple_id=pair;
  ELSE
   SELECT jsonb_build_object('local_date',day,'timezone',wallet.timezone,'rule_version',r.version,'assignments',coalesce(jsonb_agg(public.mission_assignment_view(m.id) ORDER BY m.slot),'[]')) INTO result FROM public.mission_assignments m WHERE m.couple_id=pair AND m.local_date=day;
  END IF;
  RETURN jsonb_build_object('outcome','ok','data',result);
 END IF;
 SELECT * INTO a FROM public.mission_assignments WHERE id=p_target AND couple_id=pair FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('outcome','not_found'); END IF;
 IF a.assignee_id IS NOT NULL AND a.assignee_id<>p_user THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
 IF a.local_date<>day OR a.version IS DISTINCT FROM (p_payload->>'version')::integer THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
 IF p_action='swap' THEN
  IF a.version<>0 OR EXISTS(SELECT 1 FROM public.mission_completions WHERE assignment_id=a.id) OR (SELECT coalesce(sum(m.version),0) FROM public.mission_assignments m WHERE m.couple_id=pair AND m.local_date=day)>=2 THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
  SELECT array_agg(template_id) INTO ids FROM public.mission_assignments WHERE couple_id=pair AND local_date=day;
  SELECT * INTO t FROM public.mission_templates WHERE active AND kind=a.kind AND NOT(id=ANY(ids)) ORDER BY md5(a.id||p_key||id) LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
  UPDATE public.mission_assignments SET template_id=t.id,title_vi=t.title_vi,title_en=t.title_en,description_vi=t.description_vi,description_en=t.description_en,version=version+1 WHERE id=a.id;
 ELSIF p_action='complete' THEN
  INSERT INTO public.mission_completions(assignment_id,user_id) VALUES(a.id,p_user) ON CONFLICT DO NOTHING;
  required=CASE WHEN a.kind='shared' THEN 2 ELSE 1 END;
  SELECT count(*) INTO done FROM public.mission_completions WHERE assignment_id=a.id;
  IF done=required AND a.awarded_at IS NULL THEN
   UPDATE public.mission_assignments SET awarded_at=now() WHERE id=a.id;
   PERFORM public.mission_credit(pair,a.points,'assignment',a.id,a.rule_version);
   PERFORM public.mission_bonus(pair,day);
  END IF;
 ELSE RETURN jsonb_build_object('outcome','conflict'); END IF;
 INSERT INTO public.mission_requests(actor_id,action,request_key,target_id,payload_hash,couple_id) VALUES(p_user,p_action,p_key,p_target,fingerprint,pair);
 RETURN jsonb_build_object('outcome','ok','data',public.mission_assignment_view(a.id));
END $$;
REVOKE ALL ON FUNCTION public.mission_pair(TEXT),public.mission_assignment_view(TEXT),public.mission_credit(TEXT,BIGINT,TEXT,TEXT,INTEGER),public.mission_bonus(TEXT,DATE),public.mission_operation(TEXT,TEXT,TEXT,TEXT,JSONB) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mission_pair(TEXT),public.mission_assignment_view(TEXT),public.mission_credit(TEXT,BIGINT,TEXT,TEXT,INTEGER),public.mission_bonus(TEXT,DATE),public.mission_operation(TEXT,TEXT,TEXT,TEXT,JSONB) TO service_role;
COMMIT;
NOTIFY pgrst,'reload schema';

-- Bootstrap module: 20261110_rewards.sql
-- Operator-owned physical catalog. Intentionally no reward, stock or fanpage seeds.
BEGIN;
CREATE TABLE IF NOT EXISTS public.mission_rewards(
 id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,title_vi TEXT NOT NULL,title_en TEXT NOT NULL,
 description_vi TEXT NOT NULL DEFAULT '',description_en TEXT NOT NULL DEFAULT '',
 price_points INTEGER NOT NULL CHECK(price_points>0),stock INTEGER NOT NULL CHECK(stock>=0),
 fanpage_url TEXT NOT NULL CHECK(fanpage_url LIKE 'https://%'),active BOOLEAN NOT NULL DEFAULT true,
 revision INTEGER NOT NULL DEFAULT 0,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.mission_redemptions(
 id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,couple_id TEXT NOT NULL REFERENCES public.couples(id),
 actor_id TEXT NOT NULL REFERENCES public.users(id),reward_id TEXT NOT NULL REFERENCES public.mission_rewards(id),
 price_points INTEGER NOT NULL CHECK(price_points>0),reward_snapshot JSONB NOT NULL,
 code TEXT NOT NULL UNIQUE DEFAULT ('FM-'||upper(replace(gen_random_uuid()::text,'-',''))),
 status TEXT NOT NULL DEFAULT 'pending_fulfillment' CHECK(status IN('pending_fulfillment','review','shipped','delivered','cancelled','expired')),
 expires_at TIMESTAMPTZ NOT NULL DEFAULT now()+interval '30 days',refunded_at TIMESTAMPTZ,
 shipped_at TIMESTAMPTZ,delivered_at TIMESTAMPTZ,fulfillment_reference TEXT,fulfilled_by TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK((status IN('cancelled','expired'))=(refunded_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS mission_redemption_expiry ON public.mission_redemptions(expires_at) WHERE status IN('pending_fulfillment','review');
ALTER TABLE public.mission_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_redemptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mission_rewards,public.mission_redemptions FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.mission_rewards,public.mission_redemptions TO service_role;
REVOKE INSERT,UPDATE,DELETE ON public.mission_operators FROM service_role;

CREATE OR REPLACE FUNCTION public.redemption_view(p_id TEXT) RETURNS JSONB LANGUAGE sql SET search_path=public AS $$
 SELECT to_jsonb(r)-'fulfilled_by' FROM public.mission_redemptions r WHERE id=p_id
$$;
CREATE OR REPLACE FUNCTION public.review_unpaired_redemptions() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.status='dissolved' AND OLD.status IS DISTINCT FROM NEW.status THEN
  UPDATE public.mission_redemptions SET status='review',updated_at=now() WHERE couple_id=NEW.id AND status='pending_fulfillment';
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS mission_redemptions_unpair ON public.couples;
CREATE TRIGGER mission_redemptions_unpair AFTER UPDATE OF status ON public.couples FOR EACH ROW EXECUTE FUNCTION public.review_unpaired_redemptions();

CREATE OR REPLACE FUNCTION public.reward_operation(p_user TEXT,p_action TEXT,p_target TEXT DEFAULT NULL,p_key TEXT DEFAULT NULL,p_payload JSONB DEFAULT '{}'::jsonb)
RETURNS JSONB LANGUAGE plpgsql SET search_path=public AS $$
DECLARE operator BOOLEAN;pair TEXT;c public.couples%ROWTYPE;wallet public.mission_wallets%ROWTYPE;
 r public.mission_rewards%ROWTYPE;o public.mission_redemptions%ROWTYPE;req public.mission_requests%ROWTYPE;
 result JSONB;fingerprint TEXT;v_target TEXT;new_version INTEGER;desired TEXT;can_read BOOLEAN;
BEGIN
 operator=EXISTS(SELECT 1 FROM public.mission_operators WHERE user_id=p_user AND active);
 IF p_action LIKE 'admin_%' AND NOT operator THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
 IF p_action='expire' THEN
  IF p_user IS NOT NULL THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
 ELSIF NOT EXISTS(SELECT 1 FROM public.users WHERE id=p_user) THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
 IF p_action IN('redeem','cancel','admin_create','admin_update','admin_fulfill','admin_rules_create') THEN
  IF p_key IS NULL OR char_length(p_key) NOT BETWEEN 1 AND 120 THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('reward:'||p_user||':'||p_action||':'||p_key,0));
  fingerprint=md5(coalesce(p_target,'')||p_payload::text);
  SELECT * INTO req FROM public.mission_requests WHERE actor_id=p_user AND action=p_action AND request_key=p_key;
  IF FOUND THEN
   IF req.payload_hash<>fingerprint THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
   IF p_action IN('admin_create','admin_update') THEN SELECT to_jsonb(m) INTO result FROM public.mission_rewards m WHERE id=req.target_id;
   ELSIF p_action='admin_rules_create' THEN SELECT to_jsonb(m) INTO result FROM public.mission_rules m WHERE version=req.target_id::integer;
   ELSE result=public.redemption_view(req.target_id); END IF;
   RETURN jsonb_build_object('outcome','ok','data',result);
  END IF;
 END IF;
 IF p_action='catalog' THEN
  SELECT coalesce(jsonb_agg(to_jsonb(m)),'[]') INTO result FROM(SELECT * FROM public.mission_rewards WHERE active ORDER BY created_at,id LIMIT least(100,greatest(1,coalesce((p_payload->>'limit')::int,20))) OFFSET greatest(0,coalesce((p_payload->>'offset')::int,0))) m;
 ELSIF p_action='admin_catalog' THEN
  SELECT coalesce(jsonb_agg(to_jsonb(m) ORDER BY created_at,id),'[]') INTO result FROM public.mission_rewards m;
 ELSIF p_action='admin_rules' THEN
  SELECT coalesce(jsonb_agg(to_jsonb(m) ORDER BY version DESC),'[]') INTO result FROM public.mission_rules m;
 ELSIF p_action='admin_rules_create' THEN
  LOCK TABLE public.mission_rules IN SHARE ROW EXCLUSIVE MODE;
  SELECT coalesce(max(version),0)+1 INTO new_version FROM public.mission_rules;
  INSERT INTO public.mission_rules(version,individual_points,shared_points,weekly_target,weekly_bonus,monthly_target,monthly_bonus)
   VALUES(new_version,(p_payload->>'individual_points')::int,(p_payload->>'shared_points')::int,(p_payload->>'weekly_target')::int,(p_payload->>'weekly_bonus')::int,(p_payload->>'monthly_target')::int,(p_payload->>'monthly_bonus')::int);
  SELECT to_jsonb(m) INTO result FROM public.mission_rules m WHERE version=new_version;v_target=new_version::text;
 ELSIF p_action='admin_create' THEN
  INSERT INTO public.mission_rewards(title_vi,title_en,description_vi,description_en,price_points,stock,fanpage_url,active)
   VALUES(p_payload->>'title_vi',p_payload->>'title_en',coalesce(p_payload->>'description_vi',''),coalesce(p_payload->>'description_en',''),(p_payload->>'price_points')::int,(p_payload->>'stock')::int,p_payload->>'fanpage_url',coalesce((p_payload->>'active')::bool,true)) RETURNING * INTO r;
  result=to_jsonb(r);v_target=r.id;
 ELSIF p_action='admin_update' THEN
  SELECT * INTO r FROM public.mission_rewards WHERE id=p_target FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('outcome','not_found'); END IF;
  IF r.revision IS DISTINCT FROM (p_payload->>'revision')::int THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
  UPDATE public.mission_rewards SET title_vi=p_payload->>'title_vi',title_en=p_payload->>'title_en',description_vi=p_payload->>'description_vi',description_en=p_payload->>'description_en',
   price_points=(p_payload->>'price_points')::int,stock=(p_payload->>'stock')::int,fanpage_url=p_payload->>'fanpage_url',active=(p_payload->>'active')::bool,revision=revision+1,updated_at=now() WHERE id=r.id RETURNING * INTO r;
  result=to_jsonb(r);v_target=r.id;
 ELSIF p_action='redeem' THEN
  pair=public.mission_pair(p_user);
  IF pair IS NULL THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
  INSERT INTO public.mission_wallets(couple_id) VALUES(pair) ON CONFLICT DO NOTHING;
  SELECT * INTO wallet FROM public.mission_wallets WHERE couple_id=pair FOR UPDATE;
  SELECT * INTO r FROM public.mission_rewards WHERE id=p_target FOR UPDATE;
  IF NOT FOUND OR NOT r.active THEN RETURN jsonb_build_object('outcome','not_found'); END IF;
  IF r.stock<1 OR wallet.balance<r.price_points OR r.price_points IS DISTINCT FROM (p_payload->>'expected_price')::int THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
  INSERT INTO public.mission_redemptions(couple_id,actor_id,reward_id,price_points,reward_snapshot)
   VALUES(pair,p_user,r.id,r.price_points,to_jsonb(r)) RETURNING * INTO o;
  PERFORM public.mission_credit(pair,-r.price_points,'redemption',o.id,NULL);
  UPDATE public.mission_rewards SET stock=stock-1,revision=revision+1,updated_at=now() WHERE id=r.id;
  result=public.redemption_view(o.id);v_target=o.id;
 ELSIF p_action='list' THEN
  pair=public.mission_pair(p_user);
  SELECT coalesce(jsonb_agg(public.redemption_view(m.id) ORDER BY created_at DESC),'[]') INTO result FROM(SELECT * FROM public.mission_redemptions
   WHERE actor_id=p_user OR couple_id=pair ORDER BY created_at DESC,id DESC LIMIT least(100,greatest(1,coalesce((p_payload->>'limit')::int,20))) OFFSET greatest(0,coalesce((p_payload->>'offset')::int,0))) m;
 ELSIF p_action='admin_list' THEN
  SELECT coalesce(jsonb_agg(public.redemption_view(m.id) ORDER BY created_at DESC),'[]') INTO result FROM(SELECT * FROM public.mission_redemptions ORDER BY created_at DESC LIMIT 100) m;
 ELSE
  SELECT * INTO o FROM public.mission_redemptions WHERE id=p_target;
  IF NOT FOUND THEN RETURN jsonb_build_object('outcome','not_found'); END IF;
  SELECT * INTO c FROM public.couples WHERE id=o.couple_id FOR UPDATE;
  can_read=operator OR p_user=o.actor_id OR (p_action='get' AND c.status='active' AND p_user IN(c.partner1_id,c.partner2_id)
   AND (SELECT count(*) FROM public.users WHERE id IN(c.partner1_id,c.partner2_id) AND couple_id=c.id)=2);
  IF p_action<>'expire' AND NOT coalesce(can_read,false) THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
  SELECT * INTO wallet FROM public.mission_wallets WHERE couple_id=c.id FOR UPDATE;
  SELECT * INTO r FROM public.mission_rewards WHERE id=o.reward_id FOR UPDATE;
  SELECT * INTO o FROM public.mission_redemptions WHERE id=p_target FOR UPDATE;
  IF (p_action='cancel' OR o.expires_at<=now()) AND o.status IN('pending_fulfillment','review') THEN
   desired=CASE WHEN o.expires_at<=now() THEN 'expired' ELSE 'cancelled' END;
   IF public.mission_credit(c.id,o.price_points,'refund',o.id,NULL) THEN
    UPDATE public.mission_rewards SET stock=stock+1,revision=revision+1,updated_at=now() WHERE id=r.id;
   END IF;
   UPDATE public.mission_redemptions SET status=desired,refunded_at=now(),updated_at=now() WHERE id=o.id RETURNING * INTO o;
  END IF;
  IF p_action='admin_fulfill' THEN
   desired=p_payload->>'status';
   IF desired='shipped' AND o.status IN('pending_fulfillment','review') THEN
    UPDATE public.mission_redemptions SET status='shipped',shipped_at=now(),fulfilled_by=p_user,fulfillment_reference=p_payload->>'fulfillment_reference',updated_at=now() WHERE id=o.id;
   ELSIF desired='delivered' AND o.status='shipped' THEN
    UPDATE public.mission_redemptions SET status='delivered',delivered_at=now(),fulfilled_by=p_user,updated_at=now() WHERE id=o.id;
   ELSIF desired IS DISTINCT FROM o.status THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
  ELSIF p_action='cancel' AND o.status NOT IN('cancelled','expired') THEN RETURN jsonb_build_object('outcome','conflict');
  ELSIF p_action NOT IN('get','cancel','expire') THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
  result=public.redemption_view(o.id);v_target=o.id;pair=c.id;
 END IF;
 IF p_action IN('redeem','cancel','admin_create','admin_update','admin_fulfill','admin_rules_create') THEN
  INSERT INTO public.mission_requests(actor_id,action,request_key,target_id,payload_hash,couple_id) VALUES(p_user,p_action,p_key,v_target,fingerprint,pair);
 END IF;
 RETURN jsonb_build_object('outcome','ok','data',result);
END $$;
REVOKE ALL ON FUNCTION public.redemption_view(TEXT),public.review_unpaired_redemptions(),public.reward_operation(TEXT,TEXT,TEXT,TEXT,JSONB) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.redemption_view(TEXT),public.review_unpaired_redemptions(),public.reward_operation(TEXT,TEXT,TEXT,TEXT,JSONB) TO service_role;
COMMIT;
NOTIFY pgrst,'reload schema';
