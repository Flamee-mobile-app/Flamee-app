-- Review before applying. This migration does not move or delete legacy public objects.
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_storage_path TEXT;

ALTER TABLE memory_images ALTER COLUMN url DROP NOT NULL;
ALTER TABLE memory_images ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE memory_images ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;
ALTER TABLE memory_images ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE memory_images ADD COLUMN IF NOT EXISTS size_bytes BIGINT;

CREATE INDEX IF NOT EXISTS memory_images_memory_created_idx
    ON memory_images (memory_id, created_at);

INSERT INTO storage.buckets (id, name, public)
VALUES ('flamee-media', 'flamee-media', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- No storage.objects policies are granted for flamee-media. The FastAPI
-- service_role client is the only writer/reader and returns short signed URLs.
-- Audit/migrate objects in any legacy public bucket before disabling it.

NOTIFY pgrst, 'reload schema';
