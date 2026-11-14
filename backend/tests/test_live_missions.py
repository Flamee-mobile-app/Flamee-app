"""Real development assignments/points only; never creates physical reward stock."""
import json
import os
from pathlib import Path
import secrets
from concurrent.futures import ThreadPoolExecutor

from fastapi.testclient import TestClient
import pytest

pytestmark=[pytest.mark.live_workflow,pytest.mark.skipif(os.getenv('FLAMEE_TEST_LIVE_WORKFLOW')!='1',reason='Development writes require opt-in')]


def test_real_mission_assignments_points_and_swap():
    from app.config import settings
    from app.main import create_app
    assert settings.debug
    run='mission-'+secrets.token_hex(5)
    folder=Path(__file__).resolve().parents[2]/'docs/progress/2026-11-10-native-and-moments'/run
    folder.mkdir(parents=True)
    report={'run_id':run,'complete':False,'checks':[]}
    password=secrets.token_urlsafe(24)+'Aa1'
    try:
        with TestClient(create_app()) as api:
            def call(method,path,actor=None,expected=200,key=None,**kwargs):
                headers={'Authorization':'Bearer '+actor['access_token']} if actor else {}
                if key:headers['Idempotency-Key']=key
                response=api.request(method,'/api/v1'+path,headers=headers,**kwargs)
                assert response.status_code==expected,f'{method} {path}: {response.status_code}'
                return response.json().get('data') if expected<400 else None
            actors=[call('POST','/auth/register',expected=201,json={'email':f'{run}-{i}@example.com','password':password,'full_name':f'Mission acceptance {i}'}) for i in range(3)]
            a,b,c=actors
            invitation=call('POST','/couple/invite-code',a,201)
            pair=call('POST','/couple/accept-invite',b,json={'code':invitation['code']})
            report['couple_id']=pair['id']
            call('GET','/missions/today',c,403)
            with ThreadPoolExecutor(max_workers=4) as workers:
                pages=list(workers.map(lambda _:call('GET','/missions/today',a),range(4)))
            assert len({tuple(row['id'] for row in page['assignments']) for page in pages})==1
            rows=pages[0]['assignments']
            assert len(rows)==4 and sorted(row['points'] for row in rows)==[10,10,20,20]
            report['checks'].append('concurrent real API reads create exactly four stable assignments; unrelated user forbidden')
            personal=next(row for row in rows if row['assignee_id']==a['user']['id'])
            call('POST','/missions/'+personal['id']+'/complete',b,403,key='not-owner',json={'version':0})
            shared=next(row for row in rows if row['kind']=='shared')
            swapped=call('POST','/missions/'+shared['id']+'/swap',a,key='swap',json={'version':0})
            assert swapped['version']==1 and swapped['template_id']!=shared['template_id']
            assert call('POST','/missions/'+shared['id']+'/swap',a,key='swap',json={'version':0})['id']==shared['id']
            call('POST','/missions/'+shared['id']+'/complete',b,409,key='stale',json={'version':0})
            rows=call('GET','/missions/today',a)['assignments']
            for row in rows:
                owners=[a if row['assignee_id']==a['user']['id'] else b] if row['assignee_id'] else [a,b]
                for actor in owners:
                    key=row['id']+'-'+actor['user']['id']
                    path='/missions/'+row['id']+'/complete'
                    with ThreadPoolExecutor(max_workers=3) as workers:
                        list(workers.map(lambda _:call('POST',path,actor,key=key,json={'version':row['version']}),range(3)))
            assert call('GET','/wallet',a)['balance']==60
            ledger=call('GET','/wallet/ledger?limit=100',b)
            assert len(ledger)==4 and sum(row['delta'] for row in ledger)==60
            report['checks'].append('self-only completion, swap retry and stale version protection; concurrent retries award exactly 60 points in four ledger entries')
            call('GET','/operator/rewards',a,403)
            catalog=call('GET','/rewards',a)
            report['catalog_count']=len(catalog)
            report['checks'].append('operator role cannot be forged; physical catalog read only, no reward/stock/fanpage seeded')
            assert len(call('GET','/missions/achievements',a))>=2
            report['complete']=True
    finally:
        (folder/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
