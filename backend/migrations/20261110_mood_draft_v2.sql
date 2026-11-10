-- Development review required. Adds complete draft fields; preserves legacy rows.
BEGIN;
ALTER TABLE public.moods ALTER COLUMN couple_id DROP NOT NULL;
ALTER TABLE public.moods ADD COLUMN IF NOT EXISTS draft_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.moods ADD COLUMN IF NOT EXISTS custom_emotion_label TEXT;
ALTER TABLE public.moods ADD COLUMN IF NOT EXISTS mascot_sticker_id TEXT;
ALTER TABLE public.moods ADD COLUMN IF NOT EXISTS sleep_hours INTEGER;
ALTER TABLE public.moods ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.moods ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE public.moods ADD COLUMN IF NOT EXISTS local_date TEXT;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.moods'::regclass AND conname = 'moods_draft_v2_valid') THEN
        ALTER TABLE public.moods ADD CONSTRAINT moods_draft_v2_valid CHECK (
            draft_version IN (1, 2) AND (draft_version = 1 OR (
                intensity BETWEEN 1 AND 5
                AND (note IS NULL OR char_length(note) <= 60)
                AND (custom_emotion_label IS NULL OR char_length(custom_emotion_label) BETWEEN 1 AND 32)
                AND (sleep_hours IS NULL OR sleep_hours BETWEEN 2 AND 8)
                AND jsonb_typeof(attachments) = 'array' AND jsonb_array_length(attachments) <= 3
            ))
        );
    END IF;
END $$;
COMMIT;
