-- Real daily assignments and immutable points. No physical rewards are seeded.
BEGIN;
CREATE TABLE IF NOT EXISTS public.mission_rules(
 version INTEGER PRIMARY KEY CHECK(version>0), active BOOLEAN NOT NULL DEFAULT true,
 individual_points INTEGER NOT NULL CHECK(individual_points BETWEEN 1 AND 100),
 shared_points INTEGER NOT NULL CHECK(shared_points BETWEEN 1 AND 200),
 weekly_target INTEGER NOT NULL CHECK(weekly_target BETWEEN 1 AND 28),
 weekly_bonus INTEGER NOT NULL CHECK(weekly_bonus BETWEEN 0 AND 1000),
 monthly_target INTEGER NOT NULL CHECK(monthly_target BETWEEN 1 AND 124),
 monthly_bonus INTEGER NOT NULL CHECK(monthly_bonus BETWEEN 0 AND 5000),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.mission_rules(version,individual_points,shared_points,weekly_target,weekly_bonus,monthly_target,monthly_bonus)
 VALUES(1,10,20,16,20,80,100) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS public.mission_templates(
 id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN('individual','shared')),
 title_vi TEXT NOT NULL, title_en TEXT NOT NULL, description_vi TEXT NOT NULL,
 description_en TEXT NOT NULL, active BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO public.mission_templates(id,kind,title_vi,title_en,description_vi,description_en) VALUES
 ('individual-water','individual','Một cốc nước cho mình','A glass of water','Dành một phút nghỉ và uống một cốc nước.','Take a short break and drink a glass of water.'),
 ('individual-rest','individual','Nghỉ mắt một chút','Rest your eyes','Rời màn hình và nhìn ra xa trong một phút.','Step away from the screen and look into the distance for a minute.'),
 ('individual-thanks','individual','Một lời cảm ơn','A word of thanks','Nói với người ấy một điều bạn biết ơn hôm nay.','Tell your partner one thing you appreciate today.'),
 ('individual-kindness','individual','Một điều tử tế','A kind act','Làm một việc nhỏ tử tế cho chính mình hôm nay.','Do one small kind thing for yourself today.'),
 ('shared-good','shared','Điều vui trong ngày','Something good today','Mỗi người kể một điều vui trong ngày của mình.','Each person shares one good thing from their day.'),
 ('shared-listen','shared','Lắng nghe nhau','Listen to each other','Mỗi người dành hai phút lắng nghe người kia.','Each person spends two minutes listening to the other.'),
 ('shared-memory','shared','Nhắc một kỷ niệm','Remember a moment','Mỗi người nhắc lại một kỷ niệm chung mà mình thích.','Each person recalls a shared memory they enjoy.'),
 ('shared-plan','shared','Một kế hoạch nhỏ','A small plan','Cùng chọn một hoạt động nhỏ muốn làm với nhau.','Choose one small activity you would like to do together.')
 ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS public.mission_wallets(
 couple_id TEXT PRIMARY KEY REFERENCES public.couples(id), balance BIGINT NOT NULL DEFAULT 0 CHECK(balance>=0),
 revision INTEGER NOT NULL DEFAULT 0, timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
 pending_timezone TEXT, timezone_effective_at TIMESTAMPTZ,
 rule_version INTEGER NOT NULL DEFAULT 1 REFERENCES public.mission_rules(version), rule_week DATE,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.mission_assignments(
 id TEXT PRIMARY KEY, couple_id TEXT NOT NULL REFERENCES public.couples(id), local_date DATE NOT NULL,
 slot INTEGER NOT NULL CHECK(slot BETWEEN 1 AND 4), kind TEXT NOT NULL CHECK(kind IN('individual','shared')),
 assignee_id TEXT REFERENCES public.users(id), template_id TEXT NOT NULL REFERENCES public.mission_templates(id),
 title_vi TEXT NOT NULL,title_en TEXT NOT NULL,description_vi TEXT NOT NULL,description_en TEXT NOT NULL,
 points INTEGER NOT NULL CHECK(points>0),rule_version INTEGER NOT NULL REFERENCES public.mission_rules(version),
 version INTEGER NOT NULL DEFAULT 0 CHECK(version BETWEEN 0 AND 1),
 awarded_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(couple_id,local_date,slot), CHECK((kind='individual')=(assignee_id IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS public.mission_completions(
 assignment_id TEXT NOT NULL REFERENCES public.mission_assignments(id),user_id TEXT NOT NULL REFERENCES public.users(id),
 completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),PRIMARY KEY(assignment_id,user_id)
);
CREATE TABLE IF NOT EXISTS public.mission_ledger(
 id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,couple_id TEXT NOT NULL REFERENCES public.couples(id),
 delta BIGINT NOT NULL CHECK(delta<>0),source_kind TEXT NOT NULL,source_id TEXT NOT NULL,
 rule_version INTEGER REFERENCES public.mission_rules(version),created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(couple_id,source_kind,source_id)
);
CREATE TABLE IF NOT EXISTS public.mission_periods(
 couple_id TEXT NOT NULL REFERENCES public.couples(id),kind TEXT NOT NULL CHECK(kind IN('week','month')),
 start_date DATE NOT NULL,end_date DATE NOT NULL,target INTEGER NOT NULL CHECK(target>0),
 bonus INTEGER NOT NULL CHECK(bonus>=0),rule_version INTEGER NOT NULL REFERENCES public.mission_rules(version),
 credited_at TIMESTAMPTZ,PRIMARY KEY(couple_id,kind,start_date)
);
CREATE TABLE IF NOT EXISTS public.mission_requests(
 actor_id TEXT NOT NULL REFERENCES public.users(id),action TEXT NOT NULL,request_key TEXT NOT NULL,
 target_id TEXT,payload_hash TEXT NOT NULL,couple_id TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(actor_id,action,request_key)
);
CREATE TABLE IF NOT EXISTS public.mission_operators(user_id TEXT PRIMARY KEY REFERENCES public.users(id),active BOOLEAN NOT NULL DEFAULT true);
CREATE INDEX IF NOT EXISTS mission_assignment_period ON public.mission_assignments(couple_id,local_date) WHERE awarded_at IS NOT NULL;
DO $$ DECLARE t TEXT; BEGIN
 FOREACH t IN ARRAY ARRAY['mission_rules','mission_templates','mission_wallets','mission_assignments','mission_completions','mission_ledger','mission_periods','mission_requests','mission_operators'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM anon,authenticated',t);
  EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO service_role',t);
 END LOOP;
END $$;

REVOKE UPDATE,DELETE ON public.mission_ledger FROM service_role;

CREATE OR REPLACE FUNCTION public.mission_pair(p_user TEXT) RETURNS TEXT LANGUAGE plpgsql SET search_path=public AS $$
DECLARE pair TEXT;c public.couples%ROWTYPE;members INTEGER;
BEGIN
 SELECT couple_id INTO pair FROM public.users WHERE id=p_user;
 SELECT * INTO c FROM public.couples WHERE id=pair FOR UPDATE;
 IF NOT FOUND OR c.status<>'active' OR (p_user IS DISTINCT FROM c.partner1_id AND p_user IS DISTINCT FROM c.partner2_id) THEN RETURN NULL; END IF;
 PERFORM id FROM public.users WHERE id IN(c.partner1_id,c.partner2_id) ORDER BY id FOR SHARE;
 SELECT count(*) INTO members FROM public.users WHERE id IN(c.partner1_id,c.partner2_id) AND couple_id=c.id;
 RETURN CASE WHEN members=2 THEN c.id ELSE NULL END;
END $$;
CREATE OR REPLACE FUNCTION public.mission_assignment_view(p_id TEXT) RETURNS JSONB LANGUAGE sql SET search_path=public AS $$
 SELECT to_jsonb(a)||jsonb_build_object('completed_by',coalesce((SELECT jsonb_agg(user_id ORDER BY user_id) FROM public.mission_completions WHERE assignment_id=a.id),'[]'::jsonb))
 FROM public.mission_assignments a WHERE a.id=p_id
$$;
CREATE OR REPLACE FUNCTION public.mission_credit(p_pair TEXT,p_delta BIGINT,p_kind TEXT,p_source TEXT,p_rule INTEGER DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SET search_path=public AS $$
DECLARE inserted INTEGER;
BEGIN
 INSERT INTO public.mission_ledger(couple_id,delta,source_kind,source_id,rule_version) VALUES(p_pair,p_delta,p_kind,p_source,p_rule) ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS inserted=ROW_COUNT;
 IF inserted=1 THEN UPDATE public.mission_wallets SET balance=balance+p_delta,revision=revision+1,updated_at=now() WHERE couple_id=p_pair; END IF;
 RETURN inserted=1;
END $$;
CREATE OR REPLACE FUNCTION public.mission_bonus(p_pair TEXT,p_day DATE) RETURNS VOID LANGUAGE plpgsql SET search_path=public AS $$
DECLARE r public.mission_rules%ROWTYPE;p public.mission_periods%ROWTYPE;amount INTEGER;week DATE;month DATE;
BEGIN
 SELECT rules.* INTO r FROM public.mission_rules rules JOIN public.mission_wallets w ON w.rule_version=rules.version WHERE w.couple_id=p_pair;
 week=date_trunc('week',p_day::timestamp)::date;month=date_trunc('month',p_day::timestamp)::date;
 INSERT INTO public.mission_periods VALUES(p_pair,'week',week,week+7,r.weekly_target,r.weekly_bonus,r.version,NULL) ON CONFLICT DO NOTHING;
 INSERT INTO public.mission_periods VALUES(p_pair,'month',month,(month+interval '1 month')::date,r.monthly_target,r.monthly_bonus,r.version,NULL) ON CONFLICT DO NOTHING;
 FOR p IN SELECT * FROM public.mission_periods WHERE couple_id=p_pair AND start_date<=p_day AND end_date>p_day AND credited_at IS NULL FOR UPDATE LOOP
  SELECT count(*) INTO amount FROM public.mission_assignments WHERE couple_id=p_pair AND local_date>=p.start_date AND local_date<p.end_date AND awarded_at IS NOT NULL;
  IF amount>=p.target THEN
   IF p.bonus>0 THEN PERFORM public.mission_credit(p_pair,p.bonus,'bonus',p.kind||':'||p.start_date::text,p.rule_version); END IF;
   UPDATE public.mission_periods SET credited_at=now() WHERE couple_id=p_pair AND kind=p.kind AND start_date=p.start_date;
  END IF;
 END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.mission_operation(p_user TEXT,p_action TEXT,p_target TEXT DEFAULT NULL,p_key TEXT DEFAULT NULL,p_payload JSONB DEFAULT '{}'::jsonb)
RETURNS JSONB LANGUAGE plpgsql SET search_path=public AS $$
DECLARE pair TEXT;wallet public.mission_wallets%ROWTYPE;c public.couples%ROWTYPE;r public.mission_rules%ROWTYPE;
 a public.mission_assignments%ROWTYPE;t public.mission_templates%ROWTYPE;req public.mission_requests%ROWTYPE;
 day DATE;week DATE;v_slot INTEGER;required INTEGER;done INTEGER;ids TEXT[];result JSONB;fingerprint TEXT;new_zone TEXT;
BEGIN
 IF p_action IN('complete','swap','timezone') THEN
  IF p_key IS NULL OR char_length(p_key) NOT BETWEEN 1 AND 120 THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('mission:'||p_user||':'||p_action||':'||p_key,0));
 END IF;
 pair=public.mission_pair(p_user);
 IF pair IS NULL THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
 SELECT * INTO c FROM public.couples WHERE id=pair;
 INSERT INTO public.mission_wallets(couple_id) VALUES(pair) ON CONFLICT DO NOTHING;
 SELECT * INTO wallet FROM public.mission_wallets WHERE couple_id=pair FOR UPDATE;
 IF wallet.timezone_effective_at<=now() THEN
  UPDATE public.mission_wallets SET timezone=pending_timezone,pending_timezone=NULL,timezone_effective_at=NULL WHERE couple_id=pair RETURNING * INTO wallet;
 END IF;
 day=(now() AT TIME ZONE wallet.timezone)::date;week=date_trunc('week',day::timestamp)::date;
 IF wallet.rule_week IS DISTINCT FROM week THEN
  SELECT * INTO r FROM public.mission_rules WHERE active ORDER BY version DESC LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('outcome','unavailable'); END IF;
  UPDATE public.mission_wallets SET rule_version=r.version,rule_week=week WHERE couple_id=pair RETURNING * INTO wallet;
 ELSE SELECT * INTO r FROM public.mission_rules WHERE version=wallet.rule_version; END IF;
 fingerprint=md5(coalesce(p_target,'')||p_payload::text);
 IF p_key IS NOT NULL THEN
  SELECT * INTO req FROM public.mission_requests WHERE actor_id=p_user AND action=p_action AND request_key=p_key;
  IF FOUND THEN
   IF req.couple_id<>pair OR req.target_id IS DISTINCT FROM p_target OR req.payload_hash<>fingerprint THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
   IF p_action IN('complete','swap') THEN RETURN jsonb_build_object('outcome','ok','data',public.mission_assignment_view(p_target)); END IF;
   RETURN jsonb_build_object('outcome','ok','data',to_jsonb(wallet));
  END IF;
 END IF;
 IF p_action='timezone' THEN
  new_zone=p_payload->>'timezone';
  IF NOT EXISTS(SELECT 1 FROM pg_timezone_names WHERE name=new_zone) THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
  UPDATE public.mission_wallets SET pending_timezone=new_zone,
   timezone_effective_at=(date_trunc('week',now() AT TIME ZONE new_zone)+interval '7 days') AT TIME ZONE new_zone
   WHERE couple_id=pair RETURNING * INTO wallet;
  INSERT INTO public.mission_requests(actor_id,action,request_key,target_id,payload_hash,couple_id) VALUES(p_user,p_action,p_key,p_target,fingerprint,pair);
  RETURN jsonb_build_object('outcome','ok','data',to_jsonb(wallet));
 ELSIF p_action='wallet' THEN RETURN jsonb_build_object('outcome','ok','data',to_jsonb(wallet));
 ELSIF p_action='ledger' THEN
  SELECT coalesce(jsonb_agg(to_jsonb(l)),'[]') INTO result FROM(SELECT * FROM public.mission_ledger WHERE couple_id=pair ORDER BY created_at DESC,id DESC LIMIT least(100,greatest(1,coalesce((p_payload->>'limit')::int,20))) OFFSET greatest(0,coalesce((p_payload->>'offset')::int,0))) l;
  RETURN jsonb_build_object('outcome','ok','data',result);
 END IF;
 IF p_action IN('today','achievements') THEN
  IF (SELECT count(*) FROM public.mission_templates WHERE active AND kind='individual')<2 OR (SELECT count(*) FROM public.mission_templates WHERE active AND kind='shared')<2 THEN RETURN jsonb_build_object('outcome','unavailable'); END IF;
  FOR v_slot IN 1..4 LOOP
   IF EXISTS(SELECT 1 FROM public.mission_assignments m WHERE m.couple_id=pair AND m.local_date=day AND m.slot=v_slot) THEN CONTINUE; END IF;
   SELECT array_agg(m.template_id) INTO ids FROM public.mission_assignments m WHERE m.couple_id=pair AND m.local_date=day;
   SELECT * INTO t FROM public.mission_templates WHERE active AND kind=CASE WHEN v_slot<=2 THEN 'individual' ELSE 'shared' END AND NOT(id=ANY(coalesce(ids,ARRAY[]::text[]))) ORDER BY md5(pair||day::text||id) LIMIT 1;
   INSERT INTO public.mission_assignments(id,couple_id,local_date,slot,kind,assignee_id,template_id,title_vi,title_en,description_vi,description_en,points,rule_version)
    VALUES(md5(pair||':'||day::text||':'||v_slot),pair,day,v_slot,t.kind,CASE v_slot WHEN 1 THEN c.partner1_id WHEN 2 THEN c.partner2_id ELSE NULL END,t.id,t.title_vi,t.title_en,t.description_vi,t.description_en,CASE WHEN v_slot<=2 THEN r.individual_points ELSE r.shared_points END,r.version);
  END LOOP;
  PERFORM public.mission_bonus(pair,day);
  IF p_action='achievements' THEN
   SELECT coalesce(jsonb_agg(to_jsonb(p)||jsonb_build_object('completed_count',(SELECT count(*) FROM public.mission_assignments m WHERE m.couple_id=pair AND m.local_date>=p.start_date AND m.local_date<p.end_date AND m.awarded_at IS NOT NULL)) ORDER BY start_date DESC,kind),'[]') INTO result FROM public.mission_periods p WHERE couple_id=pair;
  ELSE
   SELECT jsonb_build_object('local_date',day,'timezone',wallet.timezone,'rule_version',r.version,'assignments',coalesce(jsonb_agg(public.mission_assignment_view(m.id) ORDER BY m.slot),'[]')) INTO result FROM public.mission_assignments m WHERE m.couple_id=pair AND m.local_date=day;
  END IF;
  RETURN jsonb_build_object('outcome','ok','data',result);
 END IF;
 SELECT * INTO a FROM public.mission_assignments WHERE id=p_target AND couple_id=pair FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('outcome','not_found'); END IF;
 IF a.assignee_id IS NOT NULL AND a.assignee_id<>p_user THEN RETURN jsonb_build_object('outcome','forbidden'); END IF;
 IF a.local_date<>day OR a.version IS DISTINCT FROM (p_payload->>'version')::integer THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
 IF p_action='swap' THEN
  IF a.version<>0 OR EXISTS(SELECT 1 FROM public.mission_completions WHERE assignment_id=a.id) OR (SELECT coalesce(sum(m.version),0) FROM public.mission_assignments m WHERE m.couple_id=pair AND m.local_date=day)>=2 THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
  SELECT array_agg(template_id) INTO ids FROM public.mission_assignments WHERE couple_id=pair AND local_date=day;
  SELECT * INTO t FROM public.mission_templates WHERE active AND kind=a.kind AND NOT(id=ANY(ids)) ORDER BY md5(a.id||p_key||id) LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('outcome','conflict'); END IF;
  UPDATE public.mission_assignments SET template_id=t.id,title_vi=t.title_vi,title_en=t.title_en,description_vi=t.description_vi,description_en=t.description_en,version=version+1 WHERE id=a.id;
 ELSIF p_action='complete' THEN
  INSERT INTO public.mission_completions(assignment_id,user_id) VALUES(a.id,p_user) ON CONFLICT DO NOTHING;
  required=CASE WHEN a.kind='shared' THEN 2 ELSE 1 END;
  SELECT count(*) INTO done FROM public.mission_completions WHERE assignment_id=a.id;
  IF done=required AND a.awarded_at IS NULL THEN
   UPDATE public.mission_assignments SET awarded_at=now() WHERE id=a.id;
   PERFORM public.mission_credit(pair,a.points,'assignment',a.id,a.rule_version);
   PERFORM public.mission_bonus(pair,day);
  END IF;
 ELSE RETURN jsonb_build_object('outcome','conflict'); END IF;
 INSERT INTO public.mission_requests(actor_id,action,request_key,target_id,payload_hash,couple_id) VALUES(p_user,p_action,p_key,p_target,fingerprint,pair);
 RETURN jsonb_build_object('outcome','ok','data',public.mission_assignment_view(a.id));
END $$;
REVOKE ALL ON FUNCTION public.mission_pair(TEXT),public.mission_assignment_view(TEXT),public.mission_credit(TEXT,BIGINT,TEXT,TEXT,INTEGER),public.mission_bonus(TEXT,DATE),public.mission_operation(TEXT,TEXT,TEXT,TEXT,JSONB) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mission_pair(TEXT),public.mission_assignment_view(TEXT),public.mission_credit(TEXT,BIGINT,TEXT,TEXT,INTEGER),public.mission_bonus(TEXT,DATE),public.mission_operation(TEXT,TEXT,TEXT,TEXT,JSONB) TO service_role;
COMMIT;
NOTIFY pgrst,'reload schema';
