-- Operator-owned physical catalog. Intentionally no reward, stock or fanpage seeds.
BEGIN;
CREATE TABLE IF NOT EXISTS public.mission_rewards(
 id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,title_vi TEXT NOT NULL,title_en TEXT NOT NULL,
 description_vi TEXT NOT NULL DEFAULT '',description_en TEXT NOT NULL DEFAULT '',
 price_points INTEGER NOT NULL CHECK(price_points>0),stock INTEGER NOT NULL CHECK(stock>=0),
 fanpage_url TEXT NOT NULL CHECK(fanpage_url LIKE 'https://%'),active BOOLEAN NOT NULL DEFAULT true,
 revision INTEGER NOT NULL DEFAULT 0,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.mission_redemptions(
 id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,couple_id TEXT NOT NULL REFERENCES public.couples(id),
 actor_id TEXT NOT NULL REFERENCES public.users(id),reward_id TEXT NOT NULL REFERENCES public.mission_rewards(id),
 price_points INTEGER NOT NULL CHECK(price_points>0),reward_snapshot JSONB NOT NULL,
 code TEXT NOT NULL UNIQUE DEFAULT ('FM-'||upper(replace(gen_random_uuid()::text,'-',''))),
 status TEXT NOT NULL DEFAULT 'pending_fulfillment' CHECK(status IN('pending_fulfillment','review','shipped','delivered','cancelled','expired')),
 expires_at TIMESTAMPTZ NOT NULL DEFAULT now()+interval '30 days',refunded_at TIMESTAMPTZ,
 shipped_at TIMESTAMPTZ,delivered_at TIMESTAMPTZ,fulfillment_reference TEXT,fulfilled_by TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK((status IN('cancelled','expired'))=(refunded_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS mission_redemption_expiry ON public.mission_redemptions(expires_at) WHERE status IN('pending_fulfillment','review');
ALTER TABLE public.mission_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_redemptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mission_rewards,public.mission_redemptions FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.mission_rewards,public.mission_redemptions TO service_role;
REVOKE INSERT,UPDATE,DELETE ON public.mission_operators FROM service_role;

CREATE OR REPLACE FUNCTION public.redemption_view(p_id TEXT) RETURNS JSONB LANGUAGE sql SET search_path=public AS $$
 SELECT to_jsonb(r)-'fulfilled_by' FROM public.mission_redemptions r WHERE id=p_id
$$;
CREATE OR REPLACE FUNCTION public.review_unpaired_redemptions() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.status='dissolved' AND OLD.status IS DISTINCT FROM NEW.status THEN
  UPDATE public.mission_redemptions SET status='review',updated_at=now() WHERE couple_id=NEW.id AND status='pending_fulfillment';
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS mission_redemptions_unpair ON public.couples;
CREATE TRIGGER mission_redemptions_unpair AFTER UPDATE OF status ON public.couples FOR EACH ROW EXECUTE FUNCTION public.review_unpaired_redemptions();

CREATE OR REPLACE FUNCTION public.reward_operation(p_user TEXT,p_action TEXT,p_target TEXT DEFAULT NULL,p_key TEXT DEFAULT NULL,p_payload JSONB DEFAULT '{}'::jsonb)
RETURNS JSONB LANGUAGE plpgsql SET search_path=public AS $$
DECLARE operator BOOLEAN;pair TEXT;c public.couples%ROWTYPE;wallet public.mission_wallets%ROWTYPE;
 r public.mission_rewards%ROWTYPE;o public.mission_redemptions%ROWTYPE;req public.mission_requests%ROWTYPE;
 result JSONB;fingerprint TEXT;v_target TEXT;new_version INTEGER;desired TEXT;can_read BOOLEAN;
BEGIN
 operator=EXISTS(SELECT 1 FROM public.mission_operators WHERE user_id=p_user AND active);
 IF p_action LIKE 'admin_%' AND NOT operator THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
 IF p_action='expire' THEN
  IF p_user IS NOT NULL THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
 ELSIF NOT EXISTS(SELECT 1 FROM public.users WHERE id=p_user) THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
 IF p_action IN('redeem','cancel','admin_create','admin_update','admin_fulfill','admin_rules_create') THEN
  IF p_key IS NULL OR char_length(p_key) NOT BETWEEN 1 AND 120 THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('reward:'||p_user||':'||p_action||':'||p_key,0));
  fingerprint=md5(coalesce(p_target,'')||p_payload::text);
  SELECT * INTO req FROM public.mission_requests WHERE actor_id=p_user AND action=p_action AND request_key=p_key;
  IF FOUND THEN
   IF req.payload_hash<>fingerprint THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
   IF p_action IN('admin_create','admin_update') THEN SELECT to_jsonb(m) INTO result FROM public.mission_rewards m WHERE id=req.target_id;
   ELSIF p_action='admin_rules_create' THEN SELECT to_jsonb(m) INTO result FROM public.mission_rules m WHERE version=req.target_id::integer;
   ELSE result=public.redemption_view(req.target_id); END IF;
   RETURN jsonb_build_object('outcome','ok','data',result);
  END IF;
 END IF;
 IF p_action='catalog' THEN
  SELECT coalesce(jsonb_agg(to_jsonb(m)),'[]') INTO result FROM(SELECT * FROM public.mission_rewards WHERE active ORDER BY created_at,id LIMIT least(100,greatest(1,coalesce((p_payload->>'limit')::int,20))) OFFSET greatest(0,coalesce((p_payload->>'offset')::int,0))) m;
 ELSIF p_action='admin_catalog' THEN
  SELECT coalesce(jsonb_agg(to_jsonb(m) ORDER BY created_at,id),'[]') INTO result FROM public.mission_rewards m;
 ELSIF p_action='admin_rules' THEN
  SELECT coalesce(jsonb_agg(to_jsonb(m) ORDER BY version DESC),'[]') INTO result FROM public.mission_rules m;
 ELSIF p_action='admin_rules_create' THEN
  LOCK TABLE public.mission_rules IN SHARE ROW EXCLUSIVE MODE;
  SELECT coalesce(max(version),0)+1 INTO new_version FROM public.mission_rules;
  INSERT INTO public.mission_rules(version,individual_points,shared_points,weekly_target,weekly_bonus,monthly_target,monthly_bonus)
   VALUES(new_version,(p_payload->>'individual_points')::int,(p_payload->>'shared_points')::int,(p_payload->>'weekly_target')::int,(p_payload->>'weekly_bonus')::int,(p_payload->>'monthly_target')::int,(p_payload->>'monthly_bonus')::int);
  SELECT to_jsonb(m) INTO result FROM public.mission_rules m WHERE version=new_version;v_target=new_version::text;
 ELSIF p_action='admin_create' THEN
  INSERT INTO public.mission_rewards(title_vi,title_en,description_vi,description_en,price_points,stock,fanpage_url,active)
   VALUES(p_payload->>'title_vi',p_payload->>'title_en',coalesce(p_payload->>'description_vi',''),coalesce(p_payload->>'description_en',''),(p_payload->>'price_points')::int,(p_payload->>'stock')::int,p_payload->>'fanpage_url',coalesce((p_payload->>'active')::bool,true)) RETURNING * INTO r;
  result=to_jsonb(r);v_target=r.id;
 ELSIF p_action='admin_update' THEN
  SELECT * INTO r FROM public.mission_rewards WHERE id=p_target FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('outcome','not_found'); END IF;
  IF r.revision IS DISTINCT FROM (p_payload->>'revision')::int THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
  UPDATE public.mission_rewards SET title_vi=p_payload->>'title_vi',title_en=p_payload->>'title_en',description_vi=p_payload->>'description_vi',description_en=p_payload->>'description_en',
   price_points=(p_payload->>'price_points')::int,stock=(p_payload->>'stock')::int,fanpage_url=p_payload->>'fanpage_url',active=(p_payload->>'active')::bool,revision=revision+1,updated_at=now() WHERE id=r.id RETURNING * INTO r;
  result=to_jsonb(r);v_target=r.id;
 ELSIF p_action='redeem' THEN
  pair=public.mission_pair(p_user);
  IF pair IS NULL THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
  INSERT INTO public.mission_wallets(couple_id) VALUES(pair) ON CONFLICT DO NOTHING;
  SELECT * INTO wallet FROM public.mission_wallets WHERE couple_id=pair FOR UPDATE;
  SELECT * INTO r FROM public.mission_rewards WHERE id=p_target FOR UPDATE;
  IF NOT FOUND OR NOT r.active THEN RETURN jsonb_build_object('outcome','not_found'); END IF;
  IF r.stock<1 OR wallet.balance<r.price_points OR r.price_points IS DISTINCT FROM (p_payload->>'expected_price')::int THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
  INSERT INTO public.mission_redemptions(couple_id,actor_id,reward_id,price_points,reward_snapshot)
   VALUES(pair,p_user,r.id,r.price_points,to_jsonb(r)) RETURNING * INTO o;
  PERFORM public.mission_credit(pair,-r.price_points,'redemption',o.id,NULL);
  UPDATE public.mission_rewards SET stock=stock-1,revision=revision+1,updated_at=now() WHERE id=r.id;
  result=public.redemption_view(o.id);v_target=o.id;
 ELSIF p_action='list' THEN
  pair=public.mission_pair(p_user);
  SELECT coalesce(jsonb_agg(public.redemption_view(m.id) ORDER BY created_at DESC),'[]') INTO result FROM(SELECT * FROM public.mission_redemptions
   WHERE actor_id=p_user OR couple_id=pair ORDER BY created_at DESC,id DESC LIMIT least(100,greatest(1,coalesce((p_payload->>'limit')::int,20))) OFFSET greatest(0,coalesce((p_payload->>'offset')::int,0))) m;
 ELSIF p_action='admin_list' THEN
  SELECT coalesce(jsonb_agg(public.redemption_view(m.id) ORDER BY created_at DESC),'[]') INTO result FROM(SELECT * FROM public.mission_redemptions ORDER BY created_at DESC LIMIT 100) m;
 ELSE
  SELECT * INTO o FROM public.mission_redemptions WHERE id=p_target;
  IF NOT FOUND THEN RETURN jsonb_build_object('outcome','not_found'); END IF;
  SELECT * INTO c FROM public.couples WHERE id=o.couple_id FOR UPDATE;
  can_read=operator OR p_user=o.actor_id OR (p_action='get' AND c.status='active' AND p_user IN(c.partner1_id,c.partner2_id)
   AND (SELECT count(*) FROM public.users WHERE id IN(c.partner1_id,c.partner2_id) AND couple_id=c.id)=2);
  IF p_action<>'expire' AND NOT coalesce(can_read,false) THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
  SELECT * INTO wallet FROM public.mission_wallets WHERE couple_id=c.id FOR UPDATE;
  SELECT * INTO r FROM public.mission_rewards WHERE id=o.reward_id FOR UPDATE;
  SELECT * INTO o FROM public.mission_redemptions WHERE id=p_target FOR UPDATE;
  IF (p_action='cancel' OR o.expires_at<=now()) AND o.status IN('pending_fulfillment','review') THEN
   desired=CASE WHEN o.expires_at<=now() THEN 'expired' ELSE 'cancelled' END;
   IF public.mission_credit(c.id,o.price_points,'refund',o.id,NULL) THEN
    UPDATE public.mission_rewards SET stock=stock+1,revision=revision+1,updated_at=now() WHERE id=r.id;
   END IF;
   UPDATE public.mission_redemptions SET status=desired,refunded_at=now(),updated_at=now() WHERE id=o.id RETURNING * INTO o;
  END IF;
  IF p_action='admin_fulfill' THEN
   desired=p_payload->>'status';
   IF desired='shipped' AND o.status IN('pending_fulfillment','review') THEN
    UPDATE public.mission_redemptions SET status='shipped',shipped_at=now(),fulfilled_by=p_user,fulfillment_reference=p_payload->>'fulfillment_reference',updated_at=now() WHERE id=o.id;
   ELSIF desired='delivered' AND o.status='shipped' THEN
    UPDATE public.mission_redemptions SET status='delivered',delivered_at=now(),fulfilled_by=p_user,updated_at=now() WHERE id=o.id;
   ELSIF desired IS DISTINCT FROM o.status THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
  ELSIF p_action='cancel' AND o.status NOT IN('cancelled','expired') THEN RETURN jsonb_build_object('outcome','conflict');
  ELSIF p_action NOT IN('get','cancel','expire') THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
  result=public.redemption_view(o.id);v_target=o.id;pair=c.id;
 END IF;
 IF p_action IN('redeem','cancel','admin_create','admin_update','admin_fulfill','admin_rules_create') THEN
  INSERT INTO public.mission_requests(actor_id,action,request_key,target_id,payload_hash,couple_id) VALUES(p_user,p_action,p_key,v_target,fingerprint,pair);
 END IF;
 RETURN jsonb_build_object('outcome','ok','data',result);
END $$;
REVOKE ALL ON FUNCTION public.redemption_view(TEXT),public.review_unpaired_redemptions(),public.reward_operation(TEXT,TEXT,TEXT,TEXT,JSONB) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.redemption_view(TEXT),public.review_unpaired_redemptions(),public.reward_operation(TEXT,TEXT,TEXT,TEXT,JSONB) TO service_role;
COMMIT;
NOTIFY pgrst,'reload schema';
