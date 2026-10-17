-- Review and apply to the development database before deploying username writes.
-- Adds an optional display nickname. Existing accounts remain NULL.
-- Nicknames are not unique and are not authentication identifiers.
BEGIN;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_username_length_check'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_username_length_check
            CHECK (
                username IS NULL OR (
                    char_length(username) BETWEEN 1 AND 40
                    AND username = btrim(username)
                )
            );
    END IF;
END;
$$;

COMMIT;
