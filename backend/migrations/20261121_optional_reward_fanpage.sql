-- A physical reward may be configured before its contact page is available.
-- No catalog items, inventory or point balances are created/changed here.
BEGIN;
ALTER TABLE public.mission_rewards ALTER COLUMN fanpage_url DROP NOT NULL;
COMMIT;
NOTIFY pgrst, 'reload schema';
