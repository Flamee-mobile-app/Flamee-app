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
