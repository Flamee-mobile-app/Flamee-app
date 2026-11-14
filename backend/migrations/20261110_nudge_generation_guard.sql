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

-- Also refresh transitions so TEXT timestamps use RFC3339 for mobile DTOs.
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
