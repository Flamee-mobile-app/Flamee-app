-- Run after 20261110_private_tiny_moments.sql. No content or legacy rows removed.
BEGIN;
-- Old rows were inserted only after PUT success; retain their ready status.
ALTER TABLE public.tiny_moment_media ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ DEFAULT now();

CREATE OR REPLACE FUNCTION public.finalize_tiny_moment_media(p_user_id TEXT,p_media_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SET search_path=public AS $$
DECLARE a public.tiny_moment_media%ROWTYPE; c public.couples%ROWTYPE; members INTEGER;
BEGIN
    SELECT * INTO a FROM public.tiny_moment_media WHERE id=p_media_id;
    IF NOT FOUND OR a.owner_id<>p_user_id THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
    SELECT * INTO c FROM public.couples WHERE id=a.couple_id FOR SHARE;
    IF NOT FOUND OR c.status<>'active' OR (p_user_id IS DISTINCT FROM c.partner1_id AND p_user_id IS DISTINCT FROM c.partner2_id) THEN
        RETURN jsonb_build_object('outcome','forbidden');
    END IF;
    PERFORM id FROM public.users WHERE id IN(c.partner1_id,c.partner2_id) ORDER BY id FOR SHARE;
    SELECT count(*) INTO members FROM public.users WHERE id IN(c.partner1_id,c.partner2_id) AND couple_id=c.id;
    IF members<>2 THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
    SELECT * INTO a FROM public.tiny_moment_media WHERE id=p_media_id FOR UPDATE;
    IF NOT FOUND OR a.owner_id<>p_user_id OR a.couple_id<>c.id OR a.discarded_at IS NOT NULL THEN
        RETURN jsonb_build_object('outcome','conflict');
    END IF;
    UPDATE public.tiny_moment_media SET ready_at=coalesce(ready_at,now()) WHERE id=a.id RETURNING * INTO a;
    RETURN jsonb_build_object('outcome','ok','media',to_jsonb(a));
END;
$$;
REVOKE ALL ON FUNCTION public.finalize_tiny_moment_media(TEXT,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_tiny_moment_media(TEXT,TEXT) TO service_role;

-- Backstop the existing create RPC: reserved assets cannot be attached before
-- storage acknowledgement, even by concurrent or directly issued SQL requests.
CREATE OR REPLACE FUNCTION public.require_ready_tiny_moment_media() RETURNS trigger
LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
    IF NEW.media_id IS NOT NULL THEN
        PERFORM id FROM public.tiny_moment_media WHERE id=NEW.media_id AND ready_at IS NOT NULL AND discarded_at IS NULL FOR SHARE;
        IF NOT FOUND THEN RAISE EXCEPTION 'Moment media unavailable' USING ERRCODE='23514'; END IF;
    END IF;
    RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.require_ready_tiny_moment_media() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.require_ready_tiny_moment_media() TO service_role;
DROP TRIGGER IF EXISTS tiny_moment_media_ready ON public.tiny_moments;
CREATE TRIGGER tiny_moment_media_ready BEFORE INSERT OR UPDATE OF media_id ON public.tiny_moments
FOR EACH ROW EXECUTE FUNCTION public.require_ready_tiny_moment_media();
COMMIT;
NOTIFY pgrst, 'reload schema';
