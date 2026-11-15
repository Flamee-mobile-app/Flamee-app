-- Apply with the normal reviewed migration process; no client direct table access.
BEGIN;
CREATE TABLE IF NOT EXISTS public.memory_comments (
 id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
 memory_id TEXT NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
 author_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 parent_id TEXT REFERENCES public.memory_comments(id) ON DELETE CASCADE,
 body TEXT NOT NULL CHECK(char_length(body)<=1000),
 deleted BOOLEAN NOT NULL DEFAULT false,
 version INTEGER NOT NULL DEFAULT 0,
 request_key TEXT NOT NULL,
 request_hash TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(author_id,request_key), CHECK(deleted OR char_length(btrim(body))>0)
);
CREATE INDEX IF NOT EXISTS memory_comments_page ON public.memory_comments(memory_id,created_at DESC,id DESC);
CREATE TABLE IF NOT EXISTS public.memory_comment_hearts (
 comment_id TEXT NOT NULL REFERENCES public.memory_comments(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 PRIMARY KEY(comment_id,user_id)
);
CREATE TABLE IF NOT EXISTS public.couple_notifications (
 id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
 couple_id TEXT NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
 recipient_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 actor_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 kind TEXT NOT NULL CHECK(kind IN('comment','reply','heart')),
 memory_id TEXT REFERENCES public.memories(id) ON DELETE SET NULL,
 comment_id TEXT REFERENCES public.memory_comments(id) ON DELETE SET NULL,
 event_key TEXT NOT NULL UNIQUE,
 read_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), CHECK(recipient_id<>actor_id)
);
CREATE INDEX IF NOT EXISTS couple_notifications_page ON public.couple_notifications(recipient_id,couple_id,created_at DESC,id DESC);
ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS comment_count INTEGER NOT NULL DEFAULT 0;
DO $$ DECLARE t TEXT; BEGIN
 FOREACH t IN ARRAY ARRAY['memory_comments','memory_comment_hearts','couple_notifications'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
  EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO service_role',t);
 END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.memory_comment_view(p_id TEXT,p_user TEXT) RETURNS JSONB
LANGUAGE sql STABLE SET search_path=public AS $$
 SELECT jsonb_build_object('id',c.id,'memory_id',c.memory_id,'parent_id',c.parent_id,
 'body',CASE WHEN c.deleted THEN '' ELSE c.body END,'deleted',c.deleted,'version',c.version,
 'created_at',c.created_at,'updated_at',c.updated_at,
 'author',jsonb_build_object('id',u.id,'full_name',u.full_name,'username',u.username),
 'parent_author',CASE WHEN p.id IS NULL THEN NULL ELSE pu.full_name END,
 'heart_count',(SELECT count(*) FROM memory_comment_hearts h WHERE h.comment_id=c.id),
 'hearted',EXISTS(SELECT 1 FROM memory_comment_hearts h WHERE h.comment_id=c.id AND h.user_id=p_user))
 FROM memory_comments c JOIN users u ON u.id=c.author_id
 LEFT JOIN memory_comments p ON p.id=c.parent_id LEFT JOIN users pu ON pu.id=p.author_id WHERE c.id=p_id
$$;

CREATE OR REPLACE FUNCTION public.memory_conversation_operation(
 p_user TEXT,p_action TEXT,p_memory TEXT DEFAULT NULL,p_target TEXT DEFAULT NULL,p_key TEXT DEFAULT NULL,p_payload JSONB DEFAULT '{}'::JSONB
) RETURNS JSONB LANGUAGE plpgsql SET search_path=public AS $$
DECLARE pair TEXT; partner TEXT; cp public.couples%ROWTYPE; c public.memory_comments%ROWTYPE;
 existing public.memory_comments%ROWTYPE; par public.memory_comments%ROWTYPE;
 v_body TEXT; digest TEXT; result JSONB; total INTEGER; lim INTEGER; off INTEGER; changed INTEGER; notification public.couple_notifications%ROWTYPE;
BEGIN
 SELECT couple_id INTO pair FROM users WHERE id=p_user;
 SELECT * INTO cp FROM couples WHERE id=pair FOR UPDATE;
 IF NOT FOUND OR cp.status<>'active' OR p_user NOT IN(cp.partner1_id,cp.partner2_id) THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
 PERFORM id FROM users WHERE id IN(cp.partner1_id,cp.partner2_id) ORDER BY id FOR SHARE;
 IF (SELECT count(*) FROM users WHERE id IN(cp.partner1_id,cp.partner2_id) AND couple_id=pair)<>2 THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
 partner:=CASE WHEN p_user=cp.partner1_id THEN cp.partner2_id ELSE cp.partner1_id END;
 lim:=greatest(1,least(100,coalesce((p_payload->>'limit')::INTEGER,20)));
 off:=greatest(0,coalesce((p_payload->>'offset')::INTEGER,0));
 IF p_action IN('inbox','read','read_all') THEN
  IF p_action='read' THEN
   UPDATE couple_notifications SET read_at=coalesce(read_at,now()) WHERE id=p_target AND recipient_id=p_user AND couple_id=pair RETURNING * INTO notification;
   IF NOT FOUND THEN RETURN jsonb_build_object('outcome','not_found'); END IF;
  ELSIF p_action='read_all' THEN
   UPDATE couple_notifications SET read_at=now() WHERE recipient_id=p_user AND couple_id=pair AND read_at IS NULL;
  END IF;
  SELECT count(*) INTO total FROM couple_notifications WHERE recipient_id=p_user AND couple_id=pair;
  SELECT jsonb_build_object('items',coalesce(jsonb_agg(x.doc ORDER BY x.created_at DESC,x.id DESC),'[]'::JSONB),
   'total',total,'unread_count',(SELECT count(*) FROM couple_notifications WHERE recipient_id=p_user AND couple_id=pair AND read_at IS NULL)) INTO result FROM (
   SELECT n.id,n.created_at,jsonb_build_object('id',n.id,'kind',n.kind,'memory_id',n.memory_id,'comment_id',n.comment_id,
    'available',n.memory_id IS NOT NULL AND EXISTS(SELECT 1 FROM memories m WHERE m.id=n.memory_id AND m.couple_id=pair),
    'actor_name',u.full_name,'created_at',n.created_at,'read_at',n.read_at) AS doc
   FROM couple_notifications n JOIN users u ON u.id=n.actor_id WHERE n.recipient_id=p_user AND n.couple_id=pair ORDER BY n.created_at DESC,n.id DESC LIMIT lim OFFSET off
  ) x;
  RETURN jsonb_build_object('outcome','ok','data',result);
 END IF;
 PERFORM id FROM memories WHERE id=p_memory AND couple_id=pair FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('outcome','not_found'); END IF;
 IF p_action='list' THEN
  SELECT count(*) INTO total FROM memory_comments WHERE memory_id=p_memory;
  SELECT jsonb_build_object('items',coalesce(jsonb_agg(memory_comment_view(x.id,p_user) ORDER BY x.created_at DESC,x.id DESC),'[]'::JSONB),
    'total',total,'comment_count',(SELECT count(*) FROM memory_comments WHERE memory_id=p_memory AND NOT deleted)) INTO result
   FROM (SELECT id,created_at FROM memory_comments WHERE memory_id=p_memory ORDER BY created_at DESC,id DESC LIMIT lim OFFSET off) x;
  RETURN jsonb_build_object('outcome','ok','data',result);
 ELSIF p_action='create' THEN
  v_body:=btrim(p_payload->>'body');
  IF v_body IS NULL OR char_length(v_body) NOT BETWEEN 1 AND 1000 OR coalesce(length(p_key),0) NOT BETWEEN 1 AND 120 THEN RETURN jsonb_build_object('outcome','validation'); END IF;
  digest:=encode(sha256(convert_to(jsonb_build_array(p_memory,p_payload->>'parent_id',v_body)::TEXT,'UTF8')),'hex');
  SELECT * INTO existing FROM memory_comments WHERE author_id=p_user AND request_key=p_key;
  IF FOUND THEN
   IF existing.request_hash<>digest THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
   RETURN jsonb_build_object('outcome','ok','data',memory_comment_view(existing.id,p_user));
  END IF;
  IF p_payload->>'parent_id' IS NOT NULL THEN
   SELECT * INTO par FROM memory_comments WHERE id=p_payload->>'parent_id' AND memory_id=p_memory;
   IF NOT FOUND OR par.deleted OR par.parent_id IS NOT NULL THEN RETURN jsonb_build_object('outcome','not_found'); END IF;
  END IF;
  INSERT INTO memory_comments(memory_id,author_id,parent_id,body,request_key,request_hash)
   VALUES(p_memory,p_user,p_payload->>'parent_id',v_body,p_key,digest) RETURNING * INTO c;
  INSERT INTO couple_notifications(couple_id,recipient_id,actor_id,kind,memory_id,comment_id,event_key)
   VALUES(pair,partner,p_user,CASE WHEN c.parent_id IS NULL THEN 'comment' ELSE 'reply' END,p_memory,c.id,'comment:'||c.id);
 ELSE
  SELECT * INTO c FROM memory_comments WHERE id=p_target AND memory_id=p_memory FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('outcome','not_found'); END IF;
  IF p_action='comment' THEN RETURN jsonb_build_object('outcome','ok','data',memory_comment_view(c.id,p_user)); END IF;
  IF p_action IN('edit','delete') THEN
   IF c.author_id<>p_user THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
   IF c.deleted THEN
    IF p_action='delete' THEN RETURN jsonb_build_object('outcome','ok','data',memory_comment_view(c.id,p_user)); END IF;
    RETURN jsonb_build_object('outcome','not_found');
   END IF;
   IF c.version IS DISTINCT FROM (p_payload->>'version')::INTEGER THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
   v_body:=CASE WHEN p_action='delete' THEN '' ELSE btrim(p_payload->>'body') END;
   IF p_action='edit' AND (v_body IS NULL OR char_length(v_body) NOT BETWEEN 1 AND 1000) THEN RETURN jsonb_build_object('outcome','validation'); END IF;
   UPDATE memory_comments SET body=v_body,deleted=(p_action='delete'),version=version+1,updated_at=now() WHERE id=c.id RETURNING * INTO c;
   IF c.deleted THEN DELETE FROM memory_comment_hearts WHERE comment_id=c.id; DELETE FROM couple_notifications WHERE comment_id=c.id; END IF;
  ELSIF p_action IN('heart','unheart') THEN
   IF c.deleted THEN RETURN jsonb_build_object('outcome','not_found'); END IF;
   IF p_action='heart' THEN
    INSERT INTO memory_comment_hearts(comment_id,user_id) VALUES(c.id,p_user) ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS changed=ROW_COUNT;
    IF changed=1 AND c.author_id<>p_user THEN
     INSERT INTO couple_notifications(couple_id,recipient_id,actor_id,kind,memory_id,comment_id,event_key)
      VALUES(pair,partner,p_user,'heart',p_memory,c.id,'heart:'||c.id||':'||p_user) ON CONFLICT(event_key) DO NOTHING;
    END IF;
   ELSE
    DELETE FROM memory_comment_hearts WHERE comment_id=c.id AND user_id=p_user;
    DELETE FROM couple_notifications WHERE event_key='heart:'||c.id||':'||p_user AND recipient_id=partner;
   END IF;
  ELSE RETURN jsonb_build_object('outcome','validation'); END IF;
 END IF;
 UPDATE memories SET comment_count=(SELECT count(*) FROM memory_comments WHERE memory_id=p_memory AND NOT deleted) WHERE id=p_memory;
 RETURN jsonb_build_object('outcome','ok','data',memory_comment_view(c.id,p_user));
END $$;
REVOKE ALL ON FUNCTION public.memory_comment_view(TEXT,TEXT) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.memory_conversation_operation(TEXT,TEXT,TEXT,TEXT,TEXT,JSONB) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.memory_comment_view(TEXT,TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.memory_conversation_operation(TEXT,TEXT,TEXT,TEXT,TEXT,JSONB) TO service_role;
COMMIT;
