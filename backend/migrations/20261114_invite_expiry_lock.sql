-- Review before applying. Preserve the RPC signature for deployed clients.
BEGIN;
CREATE OR REPLACE FUNCTION accept_couple_invite(
    p_invitee_id text, p_code text, p_couple_id text, p_now text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_invite invite_codes%ROWTYPE;
    v_inviter_couple text;
    v_invitee_couple text;
    v_commit_time timestamptz;
BEGIN
    SELECT * INTO v_invite FROM invite_codes
    WHERE code = upper(trim(p_code)) FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('outcome', 'invite_not_found'); END IF;
    IF v_invite.status = 'cancelled' THEN RETURN jsonb_build_object('outcome', 'invite_cancelled'); END IF;
    IF v_invite.status = 'accepted' THEN RETURN jsonb_build_object('outcome', 'invite_used'); END IF;
    IF v_invite.status = 'expired' OR v_invite.expires_at::timestamptz <= clock_timestamp() THEN
        UPDATE invite_codes SET status = 'expired' WHERE id = v_invite.id;
        RETURN jsonb_build_object('outcome', 'invite_expired');
    END IF;
    IF v_invite.user_id = p_invitee_id THEN RETURN jsonb_build_object('outcome', 'self_invite'); END IF;
    PERFORM id FROM users WHERE id IN (v_invite.user_id, p_invitee_id) ORDER BY id FOR UPDATE;
    -- The call may have waited on either the invite or a user row. PostgreSQL's
    -- transaction timestamp (and client p_now) can be stale after that wait.
    v_commit_time := clock_timestamp();
    IF v_invite.expires_at::timestamptz <= v_commit_time THEN
        UPDATE invite_codes SET status = 'expired' WHERE id = v_invite.id;
        RETURN jsonb_build_object('outcome', 'invite_expired');
    END IF;
    SELECT couple_id INTO v_inviter_couple FROM users WHERE id = v_invite.user_id;
    SELECT couple_id INTO v_invitee_couple FROM users WHERE id = p_invitee_id;
    IF v_invitee_couple IS NOT NULL THEN RETURN jsonb_build_object('outcome', 'already_paired'); END IF;
    IF v_inviter_couple IS NOT NULL THEN RETURN jsonb_build_object('outcome', 'inviter_already_paired'); END IF;
    INSERT INTO couples (id, partner1_id, partner2_id, anniversary, status, created_at, updated_at)
    VALUES (p_couple_id, v_invite.user_id, p_invitee_id, NULL, 'active', v_commit_time::text, v_commit_time::text);
    UPDATE invite_codes SET status = 'accepted', used_by = p_invitee_id WHERE id = v_invite.id;
    UPDATE users SET couple_id = p_couple_id, updated_at = v_commit_time::text WHERE id IN (v_invite.user_id, p_invitee_id);
    RETURN jsonb_build_object('outcome', 'accepted', 'couple_id', p_couple_id);
END;
$$;
REVOKE ALL ON FUNCTION accept_couple_invite(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION accept_couple_invite(text, text, text, text) TO service_role;
COMMIT;
NOTIFY pgrst, 'reload schema';
