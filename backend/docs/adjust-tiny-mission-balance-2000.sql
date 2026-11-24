-- Requested account: voduchuy@gmail.com. Target balance: 2000, not +2000.
-- Run in the correct Supabase project's SQL Editor with database admin access.
-- This changes the couple's shared wallet, visible to both members.
-- Account, couple and existing wallet must be valid; no data is seeded.
BEGIN;
DO $$
DECLARE
  account_id text;
  pair_id text;
  account_count integer;
  current_wallet public.mission_wallets%ROWTYPE;
  adjustment bigint;
BEGIN
  SELECT count(*), min(id) INTO account_count, account_id
  FROM public.users WHERE lower(email) = 'voduchuy@gmail.com';
  IF account_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one matching account; no changes made';
  END IF;

  pair_id := public.mission_pair(account_id);
  IF pair_id IS NULL THEN
    RAISE EXCEPTION 'Account has no valid active couple; no changes made';
  END IF;

  SELECT * INTO current_wallet FROM public.mission_wallets
  WHERE couple_id = pair_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Existing wallet required; no changes made';
  END IF;
  adjustment := 2000 - current_wallet.balance;
  IF adjustment < 0 THEN
    RAISE EXCEPTION 'Balance already exceeds 2000; refusing to reduce points';
  END IF;
  IF adjustment > 0 THEN
    IF NOT public.mission_credit(
      pair_id, adjustment, 'manual_adjustment',
      'requested-voduchuy-2000-20261124', current_wallet.rule_version
    ) THEN
      RAISE EXCEPTION 'Adjustment already exists; refusing to credit again';
    END IF;
  END IF;
  IF (SELECT balance FROM public.mission_wallets WHERE couple_id = pair_id) <> 2000 THEN
    RAISE EXCEPTION 'Balance verification failed; rolling back';
  END IF;
END $$;

SELECT u.email, w.balance, w.revision
FROM public.users u JOIN public.mission_wallets w ON w.couple_id = u.couple_id
WHERE lower(u.email) = 'voduchuy@gmail.com';
COMMIT;
