from unittest.mock import Mock

from app.repositories.mission_repo import MissionRepository


def test_mission_contract_uses_authenticated_actor_and_version(client,alice_headers,monkeypatch):
    actor=client.get('/api/v1/auth/me',headers=alice_headers).json()['data']['id']
    operation=Mock(return_value={'id':'assignment','couple_id':'pair','version':0})
    monkeypatch.setattr(MissionRepository,'execute',operation)
    path='/api/v1/missions/assignment/complete'
    assert client.post(path,headers=alice_headers,json={'version':0}).status_code==422
    headers={**alice_headers,'Idempotency-Key':'stable'}
    assert client.post(path,headers=headers,json={'version':0,'user_id':'other'}).status_code==422
    assert client.post(path,headers=headers,json={'version':True}).status_code==422
    assert client.post(path,headers=headers,json={'version':0}).status_code==200
    operation.assert_called_once_with(actor,'complete','assignment','stable',{'version':0})


def test_mission_reads_require_auth_and_bound_pagination(client,alice_headers,monkeypatch):
    operation=Mock(return_value=[])
    monkeypatch.setattr(MissionRepository,'execute',operation)
    assert client.get('/api/v1/missions/today').status_code==401
    assert client.get('/api/v1/wallet/ledger?limit=101',headers=alice_headers).status_code==422
    assert client.get('/api/v1/wallet/ledger?offset=-1',headers=alice_headers).status_code==422
    assert client.get('/api/v1/missions/achievements',headers=alice_headers).status_code==200
