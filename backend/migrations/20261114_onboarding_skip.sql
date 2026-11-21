-- Preserve an explicit choice separately from onboarding completion.
BEGIN;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS onboarding_skipped_at TIMESTAMPTZ;
COMMIT;
NOTIFY pgrst, 'reload schema';
