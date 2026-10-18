-- Additive alignment for the checked-in backend. Review before applying.
-- Existing database: apply invite_flow and profile_username migrations first.
BEGIN;

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
