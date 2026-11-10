-- Ending a connection retains records; purge/export jobs are a separate rollout.
BEGIN;
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS dissolved_at TIMESTAMPTZ;
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS purge_after TIMESTAMPTZ;
CREATE OR REPLACE FUNCTION public.dissolve_couple(p_user_id TEXT, p_couple_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
    c public.couples%ROWTYPE;
    owner_pair TEXT;
BEGIN
    SELECT * INTO c FROM public.couples WHERE id = p_couple_id FOR UPDATE;
    IF NOT FOUND OR (p_user_id IS DISTINCT FROM c.partner1_id AND p_user_id IS DISTINCT FROM c.partner2_id) THEN
        RETURN jsonb_build_object('outcome', 'forbidden');
    END IF;
    IF c.status = 'dissolved' AND c.dissolved_at IS NOT NULL THEN
        RETURN jsonb_build_object('outcome', 'dissolved', 'couple_id', c.id,
          'status', c.status, 'dissolved_at', c.dissolved_at, 'purge_after', c.purge_after);
    END IF;
    IF c.status <> 'active' THEN RETURN jsonb_build_object('outcome', 'conflict'); END IF;
    -- Match accept_invite's invite-before-user lock order.
    PERFORM id FROM public.invite_codes WHERE user_id IN (c.partner1_id, c.partner2_id)
      AND status = 'pending' ORDER BY id FOR UPDATE;
    PERFORM id FROM public.users WHERE id IN (c.partner1_id, c.partner2_id) ORDER BY id FOR UPDATE;
    SELECT couple_id INTO owner_pair FROM public.users WHERE id = p_user_id;
    IF owner_pair IS DISTINCT FROM c.id THEN RETURN jsonb_build_object('outcome', 'forbidden'); END IF;
    UPDATE public.couples SET status = 'dissolved', dissolved_at = now(),
      purge_after = now() + interval '30 days', updated_at = now()::text
      WHERE id = c.id RETURNING * INTO c;
    -- A stale retry is bound to c.id and cannot detach a later connection.
    UPDATE public.users SET couple_id = NULL, updated_at = now()::text
      WHERE id IN (c.partner1_id, c.partner2_id) AND couple_id = c.id;
    UPDATE public.invite_codes SET status = 'cancelled'
      WHERE user_id IN (c.partner1_id, c.partner2_id) AND status = 'pending';
    RETURN jsonb_build_object('outcome', 'dissolved', 'couple_id', c.id,
      'status', c.status, 'dissolved_at', c.dissolved_at, 'purge_after', c.purge_after);
END;
$$;
REVOKE ALL ON FUNCTION public.dissolve_couple(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dissolve_couple(TEXT, TEXT) TO service_role;
COMMIT;
NOTIFY pgrst, 'reload schema';
