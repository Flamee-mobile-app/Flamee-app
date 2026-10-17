-- Review before applying to a Supabase project. This migration does not delete data.
-- Preflight: ensure existing status values and foreign-key references are valid.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invite_codes_status_check') THEN
    ALTER TABLE invite_codes
      ADD CONSTRAINT invite_codes_status_check
      CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'couples_status_check') THEN
    ALTER TABLE couples
      ADD CONSTRAINT couples_status_check
      CHECK (status IN ('active', 'dissolved')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invite_codes_used_by_fkey') THEN
    ALTER TABLE invite_codes
      ADD CONSTRAINT invite_codes_used_by_fkey
      FOREIGN KEY (used_by) REFERENCES users(id) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_couple_id_fkey') THEN
    ALTER TABLE users
      ADD CONSTRAINT users_couple_id_fkey
      FOREIGN KEY (couple_id) REFERENCES couples(id) NOT VALID;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS invite_codes_one_pending_per_user
  ON invite_codes (user_id)
  WHERE status = 'pending';

CREATE OR REPLACE FUNCTION accept_couple_invite(
  p_invitee_id text,
  p_code text,
  p_couple_id text,
  p_now text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite invite_codes%ROWTYPE;
  v_inviter_couple text;
  v_invitee_couple text;
BEGIN
  SELECT * INTO v_invite
  FROM invite_codes
  WHERE code = upper(trim(p_code))
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('outcome', 'invite_not_found');
  END IF;
  IF v_invite.status = 'cancelled' THEN
    RETURN jsonb_build_object('outcome', 'invite_cancelled');
  END IF;
  IF v_invite.status = 'accepted' THEN
    RETURN jsonb_build_object('outcome', 'invite_used');
  END IF;
  IF v_invite.status = 'expired' OR v_invite.expires_at::timestamptz <= p_now::timestamptz THEN
    UPDATE invite_codes SET status = 'expired' WHERE id = v_invite.id;
    RETURN jsonb_build_object('outcome', 'invite_expired');
  END IF;
  IF v_invite.user_id = p_invitee_id THEN
    RETURN jsonb_build_object('outcome', 'self_invite');
  END IF;

  -- Stable ordering prevents deadlocks when concurrent requests lock the same users.
  PERFORM id FROM users
  WHERE id IN (v_invite.user_id, p_invitee_id)
  ORDER BY id
  FOR UPDATE;

  SELECT couple_id INTO v_inviter_couple FROM users WHERE id = v_invite.user_id;
  SELECT couple_id INTO v_invitee_couple FROM users WHERE id = p_invitee_id;

  IF v_invitee_couple IS NOT NULL THEN
    RETURN jsonb_build_object('outcome', 'already_paired');
  END IF;
  IF v_inviter_couple IS NOT NULL THEN
    RETURN jsonb_build_object('outcome', 'inviter_already_paired');
  END IF;

  INSERT INTO couples (
    id, partner1_id, partner2_id, anniversary, status, created_at, updated_at
  ) VALUES (
    p_couple_id, v_invite.user_id, p_invitee_id, NULL, 'active', p_now, p_now
  );

  UPDATE invite_codes
  SET status = 'accepted', used_by = p_invitee_id
  WHERE id = v_invite.id;

  UPDATE users
  SET couple_id = p_couple_id, updated_at = p_now
  WHERE id IN (v_invite.user_id, p_invitee_id);

  RETURN jsonb_build_object('outcome', 'accepted', 'couple_id', p_couple_id);
END;
$$;

REVOKE ALL ON FUNCTION accept_couple_invite(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION accept_couple_invite(text, text, text, text) TO service_role;

