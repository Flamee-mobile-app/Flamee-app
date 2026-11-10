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
