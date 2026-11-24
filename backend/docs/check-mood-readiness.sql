-- Read-only diagnostics. Run in the SQL Editor of the database used by the backend.
-- Returns schema/RPC status only; does not read check-ins or credentials.
WITH checks AS (
  SELECT 'table.mood_daily_reminders' AS requirement,
    to_regclass('public.mood_daily_reminders') IS NOT NULL AS present
  UNION ALL
  SELECT 'rpc.mood_e2e_capabilities',
    to_regprocedure('public.mood_e2e_capabilities()') IS NOT NULL
  UNION ALL
  SELECT 'rpc.mood_daily_reminder_operation',
    to_regprocedure('public.mood_daily_reminder_operation(text,text,text,text,integer,integer)') IS NOT NULL
  UNION ALL
  SELECT 'rpc.create_smart_nudge_guarded',
    to_regprocedure('public.create_smart_nudge_guarded(jsonb)') IS NOT NULL
  UNION ALL
  SELECT 'moods.' || required.name, EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'moods' AND column_name = required.name
  ) FROM unnest(ARRAY['draft_version','custom_emotion_label','mascot_sticker_id','sleep_hours','attachments','timezone','local_date','mood_score']) AS required(name)
  UNION ALL
  SELECT 'smart_nudges.' || required.name, EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'smart_nudges' AND column_name = required.name
  ) FROM unnest(ARRAY['dual_mood_generated','source_mood_id','receiver_mood_id']) AS required(name)
  UNION ALL
  SELECT 'permission.service_role.mood_e2e_capabilities', COALESCE(
    has_function_privilege('service_role', to_regprocedure('public.mood_e2e_capabilities()'), 'EXECUTE'), false)
)
SELECT requirement, present FROM checks ORDER BY present, requirement;
