-- Server-owned, user-scoped reminder; supports users without a couple.
BEGIN;
ALTER TABLE public.smart_nudges ADD COLUMN IF NOT EXISTS dual_mood_generated BOOLEAN DEFAULT false;
ALTER TABLE public.smart_nudges ADD COLUMN IF NOT EXISTS source_mood_id TEXT;
ALTER TABLE public.smart_nudges ADD COLUMN IF NOT EXISTS receiver_mood_id TEXT;
CREATE TABLE IF NOT EXISTS public.mood_daily_reminders (
 id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
 user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 local_date DATE NOT NULL,
 timezone TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 read_at TIMESTAMPTZ,
 UNIQUE(user_id, local_date)
);
ALTER TABLE public.mood_daily_reminders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mood_daily_reminders FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.mood_daily_reminders TO service_role;

CREATE OR REPLACE FUNCTION public.mood_daily_reminder_operation(p_user TEXT,p_action TEXT,p_timezone TEXT DEFAULT 'UTC',p_target TEXT DEFAULT NULL,p_limit INTEGER DEFAULT 20,p_offset INTEGER DEFAULT 0)
RETURNS JSONB LANGUAGE plpgsql SET search_path=public AS $$
DECLARE today DATE; reminder public.mood_daily_reminders%ROWTYPE; inserted BOOLEAN := false; data JSONB;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM users WHERE id=p_user) THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
 IF p_timezone IS NULL OR NOT EXISTS(SELECT 1 FROM pg_timezone_names WHERE name=p_timezone) THEN RETURN jsonb_build_object('outcome','validation'); END IF;
 today := (now() AT TIME ZONE p_timezone)::DATE;
 IF p_action='ensure' THEN
  -- One user/day and transaction lock protect simultaneous app starts and retries.
  PERFORM pg_advisory_xact_lock(hashtextextended('mood-reminder:' || p_user || ':' || today::TEXT,0));
  IF EXISTS(SELECT 1 FROM moods WHERE user_id=p_user AND created_at::timestamptz >= (today::timestamp AT TIME ZONE p_timezone)
    AND created_at::timestamptz < ((today + 1)::timestamp AT TIME ZONE p_timezone)) THEN
   UPDATE mood_daily_reminders SET read_at=coalesce(read_at,now()) WHERE user_id=p_user AND local_date=today;
   RETURN jsonb_build_object('outcome','ok','data',jsonb_build_object('show_prompt',false,'reminder',NULL));
  END IF;
  INSERT INTO mood_daily_reminders(user_id,local_date,timezone) VALUES(p_user,today,p_timezone)
   ON CONFLICT(user_id,local_date) DO NOTHING RETURNING * INTO reminder;
  inserted := FOUND;
  IF NOT inserted THEN SELECT * INTO reminder FROM mood_daily_reminders WHERE user_id=p_user AND local_date=today; END IF;
  RETURN jsonb_build_object('outcome','ok','data',jsonb_build_object('show_prompt',inserted,'reminder',to_jsonb(reminder) - 'user_id'));
 ELSIF p_action='read' THEN
  UPDATE mood_daily_reminders SET read_at=coalesce(read_at,now()) WHERE id=p_target AND user_id=p_user RETURNING * INTO reminder;
  IF NOT FOUND THEN RETURN jsonb_build_object('outcome','not_found'); END IF;
  RETURN jsonb_build_object('outcome','ok','data',to_jsonb(reminder) - 'user_id');
 ELSIF p_action='read_all' THEN
  UPDATE mood_daily_reminders SET read_at=now() WHERE user_id=p_user AND read_at IS NULL;
  RETURN jsonb_build_object('outcome','ok','data',jsonb_build_object('unread_count',0));
 ELSIF p_action='list' THEN
  SELECT jsonb_build_object('items',coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC,r.id DESC),'[]'::JSONB),
    'total',(SELECT count(*) FROM mood_daily_reminders WHERE user_id=p_user),
    'unread_count',(SELECT count(*) FROM mood_daily_reminders WHERE user_id=p_user AND read_at IS NULL)) INTO data
   FROM (SELECT id,local_date,timezone,created_at,read_at FROM mood_daily_reminders WHERE user_id=p_user ORDER BY created_at DESC,id DESC LIMIT greatest(1,least(100,p_limit)) OFFSET greatest(0,p_offset)) r;
  RETURN jsonb_build_object('outcome','ok','data',data);
 END IF;
 RETURN jsonb_build_object('outcome','validation');
END $$;
REVOKE ALL ON FUNCTION public.mood_daily_reminder_operation(TEXT,TEXT,TEXT,TEXT,INTEGER,INTEGER) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mood_daily_reminder_operation(TEXT,TEXT,TEXT,TEXT,INTEGER,INTEGER) TO service_role;

-- Readiness is false unless both the daily reminder RPC and the v2 mood schema exist.
-- Dual-mood templates refresh when either confirmed Mood changes; duplicate contexts retain the atomic guard.
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
    IF n.dual_mood_generated AND (n.source_mood_id IS NULL OR n.receiver_mood_id IS NULL) THEN
        RETURN jsonb_build_object('outcome', 'suppressed');
    END IF;
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
      WHERE couple_id = c.id AND receiver_id = n.receiver_id
        AND (NOT COALESCE(n.dual_mood_generated, false) OR (dual_mood_generated IS TRUE AND source_mood_id = n.source_mood_id AND receiver_mood_id = n.receiver_mood_id)) AND created_at::timestamptz >= day_start;
    IF day_count >= 3 THEN RETURN jsonb_build_object('outcome', 'suppressed'); END IF;
    SELECT max(created_at::timestamptz) INTO latest_at FROM public.smart_nudges
      WHERE couple_id = c.id AND receiver_id = n.receiver_id
        AND (NOT COALESCE(n.dual_mood_generated, false) OR (dual_mood_generated IS TRUE AND source_mood_id = n.source_mood_id AND receiver_mood_id = n.receiver_mood_id));
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

CREATE OR REPLACE FUNCTION public.mood_e2e_capabilities() RETURNS JSONB LANGUAGE sql STABLE SET search_path=public AS $$
 SELECT jsonb_build_object('dual_mood_nudge',
  to_regclass('public.mood_daily_reminders') IS NOT NULL
  AND to_regprocedure('public.mood_daily_reminder_operation(text,text,text,text,integer,integer)') IS NOT NULL
  AND to_regprocedure('public.create_smart_nudge_guarded(jsonb)') IS NOT NULL
  AND (SELECT count(*)=3 FROM information_schema.columns WHERE table_schema='public' AND table_name='smart_nudges' AND column_name IN ('dual_mood_generated','source_mood_id','receiver_mood_id'))
  AND (SELECT count(*)=8 FROM information_schema.columns WHERE table_schema='public' AND table_name='moods'
       AND column_name IN ('draft_version','custom_emotion_label','mascot_sticker_id','sleep_hours','attachments','timezone','local_date','mood_score')))
$$;
REVOKE ALL ON FUNCTION public.mood_e2e_capabilities() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mood_e2e_capabilities() TO service_role;
COMMIT;
