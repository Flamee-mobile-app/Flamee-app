"""Real PostgreSQL transactions; isolated database must be named flamee_ci*.

No Supabase credentials or networked business fixtures are used here.
"""
import json
import os
from pathlib import Path
import secrets
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlsplit

import pytest

pytestmark = [pytest.mark.sql_integration, pytest.mark.skipif(
    not os.getenv('FLAMEE_TEST_POSTGRES_DSN'), reason='Ephemeral PostgreSQL is opt-in')]


@pytest.fixture(scope='module')
def database():
    import psycopg
    dsn=os.environ['FLAMEE_TEST_POSTGRES_DSN']
    parsed=urlsplit(dsn)
    assert parsed.hostname in ('127.0.0.1','localhost') and parsed.path.startswith('/flamee_ci'), 'Isolated CI database only'
    with psycopg.connect(dsn,autocommit=True) as db:
        db.execute("CREATE SCHEMA IF NOT EXISTS storage; CREATE TABLE IF NOT EXISTS storage.buckets(id TEXT PRIMARY KEY,name TEXT,public BOOLEAN)")
        for role in ('anon','authenticated','service_role'):
            if not db.execute('SELECT 1 FROM pg_roles WHERE rolname=%s',(role,)).fetchone():
                db.execute('CREATE ROLE '+role+(' BYPASSRLS' if role=='service_role' else ''))
        if not db.execute("SELECT to_regclass('public.users')").fetchone()[0]:
            db.execute((Path(__file__).resolve().parents[1]/'schema.sql').read_text(encoding='utf-8'))
        # The migration is also intentionally reapplied to check repeatability.
        db.execute((Path(__file__).resolve().parents[1]/'migrations/20261110_missions.sql').read_text(encoding='utf-8'))
        db.execute((Path(__file__).resolve().parents[1]/'migrations/20261110_rewards.sql').read_text(encoding='utf-8'))
    return dsn


@pytest.fixture
def pair(database):
    import psycopg
    run='sql-'+secrets.token_hex(6)
    a,b,c=[run+suffix for suffix in ('a','b','c')]
    couple=run+'pair'
    with psycopg.connect(database,autocommit=True) as db:
        for user in (a,b,c):
            db.execute("INSERT INTO users(id,email,password_hash,full_name,created_at,updated_at) VALUES(%s,%s,'unused-test-hash',%s,now()::text,now()::text)",(user,user+'@example.com',user))
        db.execute("INSERT INTO couples(id,partner1_id,partner2_id,created_at,updated_at) VALUES(%s,%s,%s,now()::text,now()::text)",(couple,a,b))
        db.execute('UPDATE users SET couple_id=%s WHERE id IN(%s,%s)',(couple,a,b))
    def call(actor,action,target=None,key=None,payload=None):
        with psycopg.connect(database,autocommit=True) as db:
            db.execute('SET ROLE service_role')
            return db.execute('SELECT mission_operation(%s,%s,%s,%s,%s::jsonb)',(actor,action,target,key,json.dumps(payload or {}))).fetchone()[0]
    return a,b,c,couple,call


def test_assign_four_and_complete_once_under_race(pair):
    a,b,c,couple,call=pair
    with ThreadPoolExecutor(max_workers=4) as workers:
        results=list(workers.map(lambda _:call(a,'today'),range(4)))
    assert all(row['outcome']=='ok' and len(row['data']['assignments'])==4 for row in results)
    missions=results[0]['data']['assignments']
    assert sorted(row['points'] for row in missions)==[10,10,20,20]
    personal=next(row for row in missions if row['assignee_id']==a)
    assert call(b,'complete',personal['id'],'forged',{'version':0})['outcome']=='forbidden'
    assert call(c,'today')['outcome']=='forbidden'
    with ThreadPoolExecutor(max_workers=4) as workers:
        completed=list(workers.map(lambda _:call(a,'complete',personal['id'],'same-key',{'version':0}),range(4)))
    assert all(row['outcome']=='ok' for row in completed)
    assert call(a,'wallet')['data']['balance']==10
    for mission in missions:
        if mission['id']==personal['id']:continue
        actors=[mission['assignee_id']] if mission['assignee_id'] else [a,b]
        for actor in actors:
            assert call(actor,'complete',mission['id'],mission['id']+actor,{'version':0})['outcome']=='ok'
    assert call(a,'wallet')['data']['balance']==60
    assert len(call(a,'ledger')['data'])==4


def test_swap_limits_and_stale_template_version(pair):
    a,b,c,couple,call=pair
    missions=call(a,'today')['data']['assignments']
    shared=[row for row in missions if row['kind']=='shared']
    first=call(a,'swap',shared[0]['id'],'swap-one',{'version':0})
    assert first['outcome']=='ok' and first['data']['version']==1
    assert first['data']['template_id']!=shared[0]['template_id']
    assert call(a,'swap',shared[0]['id'],'swap-one',{'version':0})['outcome']=='ok'
    assert call(b,'complete',shared[0]['id'],'stale',{'version':0})['outcome']=='conflict'
    assert call(a,'swap',shared[0]['id'],'swap-again',{'version':1})['outcome']=='conflict'
    assert call(b,'swap',shared[1]['id'],'swap-two',{'version':0})['outcome']=='ok'
    personal=next(row for row in missions if row['assignee_id']==a)
    assert call(a,'swap',personal['id'],'swap-three',{'version':0})['outcome']=='conflict'


def reward_fixture(database,pair,stock=1):
    import psycopg
    a,b,c,couple,mission=pair
    for assignment in mission(a,'today')['data']['assignments']:
        for actor in ([assignment['assignee_id']] if assignment['assignee_id'] else [a,b]):
            assert mission(actor,'complete',assignment['id'],assignment['id']+actor,{'version':0})['outcome']=='ok'
    with psycopg.connect(database,autocommit=True) as db:
        db.execute('INSERT INTO mission_operators(user_id) VALUES(%s)',(c,))
    def reward(actor,action,target=None,key=None,payload=None):
        with psycopg.connect(database,autocommit=True) as db:
            db.execute('SET ROLE service_role')
            return db.execute('SELECT reward_operation(%s,%s,%s,%s,%s::jsonb)',(actor,action,target,key,json.dumps(payload or {}))).fetchone()[0]
    catalog={'title_vi':'Ephemeral SQL fixture','title_en':'Ephemeral SQL fixture','price_points':20,'stock':stock,'fanpage_url':'https://example.invalid/ci-only'}
    assert reward(a,'admin_create',key='not-operator',payload=catalog)['outcome']=='forbidden'
    item=reward(c,'admin_create',key='catalog-fixture',payload=catalog)['data']
    return item,reward


def test_redemption_stock_race_retry_and_refund_once(database,pair):
    a,b,c,couple,mission=pair
    item,reward=reward_fixture(database,pair)
    requests=[(a if index%2==0 else b,'redeem-'+str(index)) for index in range(8)]
    with ThreadPoolExecutor(max_workers=8) as workers:
        results=list(workers.map(lambda entry:reward(entry[0],'redeem',item['id'],entry[1],{'expected_price':20}),requests))
    winners=[(requests[index],row['data']) for index,row in enumerate(results) if row['outcome']=='ok']
    assert len(winners)==1
    (owner,key),order=winners[0]
    assert order['code'].startswith('FM-') and len(order['code'])==35
    assert mission(a,'wallet')['data']['balance']==40
    assert reward(owner,'redeem',item['id'],key,{'expected_price':20})['data']['id']==order['id']
    assert next(row for row in reward(c,'admin_catalog')['data'] if row['id']==item['id'])['stock']==0
    with ThreadPoolExecutor(max_workers=4) as workers:
        cancelled=list(workers.map(lambda index:reward(owner,'cancel',order['id'],'cancel-'+str(index)),range(4)))
    assert all(row['data']['status']=='cancelled' for row in cancelled)
    assert mission(a,'wallet')['data']['balance']==60
    assert next(row for row in reward(c,'admin_catalog')['data'] if row['id']==item['id'])['stock']==1
    assert sum(row['source_kind']=='refund' for row in mission(a,'ledger',payload={'limit':100})['data'])==1


def test_unpair_review_shipped_no_refund_and_expiry(database,pair):
    import psycopg
    a,b,c,couple,mission=pair
    item,reward=reward_fixture(database,pair,stock=3)
    first=reward(a,'redeem',item['id'],'first',{'expected_price':20})['data']
    second=reward(a,'redeem',item['id'],'second',{'expected_price':20})['data']
    with psycopg.connect(database,autocommit=True) as db:
        db.execute("UPDATE couples SET status='dissolved' WHERE id=%s",(couple,))
    assert reward(a,'get',first['id'])['data']['status']=='review'
    assert reward(b,'get',first['id'])['outcome']=='forbidden'
    shipped=reward(c,'admin_fulfill',first['id'],'ship',{'status':'shipped','fulfillment_reference':'CI-only-fixture-reference'})
    assert shipped['data']['status']=='shipped'
    assert reward(a,'cancel',first['id'],'cancel-shipped')['outcome']=='conflict'
    with psycopg.connect(database,autocommit=True) as db:
        db.execute("UPDATE mission_redemptions SET expires_at=now()-interval '1 second' WHERE id=%s",(second['id'],))
    with ThreadPoolExecutor(max_workers=4) as workers:
        expired=list(workers.map(lambda _:reward(None,'expire',second['id']),range(4)))
    assert all(row['data']['status']=='expired' for row in expired)
    with psycopg.connect(database,autocommit=True) as db:
        assert db.execute('SELECT balance FROM mission_wallets WHERE couple_id=%s',(couple,)).fetchone()[0]==40
        assert db.execute('SELECT stock FROM mission_rewards WHERE id=%s',(item['id'],)).fetchone()[0]==2


def test_week_month_bonuses_are_single_ledger_events(database,pair):
    import psycopg
    a,b,c,couple,mission=pair
    mission(a,'today')
    with psycopg.connect(database,autocommit=True) as db:
        for day in range(9,29):
            for slot in range(1,5):
                assignment=f'{couple}-202701{day}-{slot}'
                points=10 if slot<=2 else 20
                db.execute("INSERT INTO mission_assignments(id,couple_id,local_date,slot,kind,assignee_id,template_id,title_vi,title_en,description_vi,description_en,points,rule_version,awarded_at) VALUES(%s,%s,%s,%s,%s,%s,'individual-water','CI fixture','CI fixture','','',%s,1,now())",
                    (assignment,couple,f'2027-01-{day:02}',slot,'individual' if slot<=2 else 'shared',a if slot==1 else b if slot==2 else None,points))
                db.execute("SELECT mission_credit(%s,%s,'assignment',%s,1)",(couple,points,assignment))
                if day==28 and slot==3:
                    # 79 in the month and 15 in the final week are below both thresholds.
                    db.execute("SELECT mission_bonus(%s,'2027-01-31'::date)",(couple,))
                    assert db.execute("SELECT count(*) FROM mission_ledger WHERE couple_id=%s AND source_kind='bonus'",(couple,)).fetchone()[0]==0
    def bonus(_):
        with psycopg.connect(database,autocommit=True) as db:
            db.execute('SET ROLE service_role')
            db.execute("SELECT mission_bonus(%s,'2027-01-31'::date)",(couple,))
    with ThreadPoolExecutor(max_workers=4) as workers:list(workers.map(bonus,range(4)))
    assert mission(a,'wallet')['data']['balance']==1320
    ledger=mission(a,'ledger',payload={'limit':100})['data']
    assert sorted(row['delta'] for row in ledger if row['source_kind']=='bonus')==[20,100]
    with psycopg.connect(database,autocommit=True) as db:
        db.execute('SET ROLE service_role')
        with pytest.raises(psycopg.errors.InsufficientPrivilege):db.execute('UPDATE mission_ledger SET delta=999 WHERE couple_id=%s',(couple,))


def test_timezone_change_is_deferred_and_retry_preserves_daily_assignments(database,pair):
    import psycopg
    a,b,c,couple,mission=pair
    original=mission(a,'today')['data']
    assert mission(a,'timezone',key='invalid-zone',payload={'timezone':'Not/AZone'})['outcome']=='conflict'
    changed=mission(a,'timezone',key='zone-change',payload={'timezone':'Pacific/Auckland'})
    assert changed['outcome']=='ok'
    assert mission(a,'timezone',key='zone-change',payload={'timezone':'Pacific/Auckland'})==changed
    before=mission(a,'today')['data']
    assert before['timezone']==original['timezone']
    assert [item['id'] for item in before['assignments']]==[item['id'] for item in original['assignments']]
    with psycopg.connect(database,autocommit=True) as db:
        pending,effective=db.execute('SELECT pending_timezone,timezone_effective_at FROM mission_wallets WHERE couple_id=%s',(couple,)).fetchone()
        assert pending=='Pacific/Auckland'
        assert db.execute("SELECT %s::timestamptz>now() AND extract(isodow FROM %s::timestamptz AT TIME ZONE 'Pacific/Auckland')=1",(effective,effective)).fetchone()[0]
        # Move only the isolated fixture deadline; application still uses real server time.
        db.execute("UPDATE mission_wallets SET timezone_effective_at=now()-interval '1 second' WHERE couple_id=%s",(couple,))
    assert mission(b,'today')['data']['timezone']=='Pacific/Auckland'
    with psycopg.connect(database,autocommit=True) as db:
        assert db.execute('SELECT pending_timezone IS NULL AND timezone_effective_at IS NULL FROM mission_wallets WHERE couple_id=%s',(couple,)).fetchone()[0]


def test_reward_quote_revision_and_key_payload_conflicts_do_not_debit(database,pair):
    a,b,c,couple,mission=pair
    item,reward=reward_fixture(database,pair,stock=2)
    assert reward(a,'redeem',item['id'],'wrong-quote',{'expected_price':19})['outcome']=='conflict'
    assert mission(a,'wallet')['data']['balance']==60
    payload={name:item[name] for name in ('title_vi','title_en','description_vi','description_en','price_points','stock','fanpage_url','active','revision')}
    payload['price_points']=25
    updated=reward(c,'admin_update',item['id'],'new-price',payload)
    assert updated['outcome']=='ok' and updated['data']['revision']==item['revision']+1
    assert reward(c,'admin_update',item['id'],'stale-edit',payload)['outcome']=='conflict'
    assert reward(a,'redeem',item['id'],'stale-price',{'expected_price':20})['outcome']=='conflict'
    order=reward(a,'redeem',item['id'],'current-price',{'expected_price':25})
    assert order['outcome']=='ok' and mission(a,'wallet')['data']['balance']==35
    assert reward(a,'redeem',item['id'],'current-price',{'expected_price':20})['outcome']=='conflict'
    assert mission(a,'wallet')['data']['balance']==35
