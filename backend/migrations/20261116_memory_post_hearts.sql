BEGIN;
CREATE TABLE IF NOT EXISTS public.memory_post_hearts (
 memory_id TEXT NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 PRIMARY KEY(memory_id,user_id)
);
ALTER TABLE public.memory_post_hearts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.memory_post_hearts FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.memory_post_hearts TO service_role;
CREATE OR REPLACE FUNCTION public.memory_post_heart_operation(p_user TEXT,p_memory TEXT,p_desired BOOLEAN DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SET search_path=public AS $$
DECLARE pair TEXT; cp public.couples%ROWTYPE;
BEGIN
 SELECT couple_id INTO pair FROM users WHERE id=p_user;
 SELECT * INTO cp FROM couples WHERE id=pair FOR UPDATE;
 IF NOT FOUND OR cp.status<>'active' OR p_user NOT IN(cp.partner1_id,cp.partner2_id) THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
 PERFORM id FROM users WHERE id IN(cp.partner1_id,cp.partner2_id) ORDER BY id FOR SHARE;
 IF (SELECT count(*) FROM users WHERE id IN(cp.partner1_id,cp.partner2_id) AND couple_id=pair)<>2 THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
 PERFORM id FROM memories WHERE id=p_memory AND couple_id=pair FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('outcome','not_found'); END IF;
 IF p_desired IS TRUE THEN
  INSERT INTO memory_post_hearts(memory_id,user_id) VALUES(p_memory,p_user) ON CONFLICT DO NOTHING;
 ELSIF p_desired IS FALSE THEN
  DELETE FROM memory_post_hearts WHERE memory_id=p_memory AND user_id=p_user;
 END IF;
 RETURN jsonb_build_object('outcome','ok','data',jsonb_build_object('memory_id',p_memory,
  'heart_count',(SELECT count(*) FROM memory_post_hearts WHERE memory_id=p_memory),
  'hearted',EXISTS(SELECT 1 FROM memory_post_hearts WHERE memory_id=p_memory AND user_id=p_user)));
END $$;
REVOKE ALL ON FUNCTION public.memory_post_heart_operation(TEXT,TEXT,BOOLEAN) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.memory_post_heart_operation(TEXT,TEXT,BOOLEAN) TO service_role;
COMMIT;
