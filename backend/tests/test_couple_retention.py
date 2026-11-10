from datetime import datetime, timedelta

from tests.test_smart_nudge_state import _pair


def test_unpair_requires_exact_couple_and_explicit_confirmation(client, alice_headers, bob_headers):
    _pair(client, alice_headers, bob_headers)
    assert client.delete('/api/v1/couple', headers=alice_headers).status_code == 422
    assert client.request('DELETE', '/api/v1/couple', headers=alice_headers, json={'couple_id': 'other', 'confirm': True}).status_code == 403


def test_unpair_retains_data_revokes_shared_scope_and_retries_safely(client, alice_headers, bob_headers, fake_db):
    _pair(client, alice_headers, bob_headers)
    pair = client.get('/api/v1/couple', headers=alice_headers).json()['data']['id']
    memory = client.post('/api/v1/memories', headers=alice_headers, json={'title': 'Retained', 'memory_date': '2026-11-10', 'category': 'other'}).json()['data']
    body = {'couple_id': pair, 'confirm': True}
    response = client.request('DELETE', '/api/v1/couple', headers=alice_headers, json=body)
    assert response.status_code == 200
    result = response.json()['data']
    assert result['couple_id'] == pair and result['status'] == 'dissolved'
    assert datetime.fromisoformat(result['purge_after']) - datetime.fromisoformat(result['dissolved_at']) == timedelta(days=30)
    assert fake_db.table('couples')._data[pair]['status'] == 'dissolved'
    assert memory['id'] in fake_db.table('memories')._data
    for headers in [alice_headers, bob_headers]:
        assert client.get('/api/v1/auth/me', headers=headers).json()['data']['couple_id'] is None
        assert client.get('/api/v1/memories/' + memory['id'], headers=headers).status_code == 404
    replay = client.request('DELETE', '/api/v1/couple', headers=bob_headers, json=body)
    assert replay.status_code == 200 and replay.json()['data'] == result
    # Replay of a request for the old pair must never dissolve a later pair.
    owner = client.get('/api/v1/auth/me', headers=alice_headers).json()['data']['id']
    fake_db.table('users')._data[owner]['couple_id'] = 'new-pair'
    assert client.request('DELETE', '/api/v1/couple', headers=alice_headers, json=body).status_code == 200
    assert fake_db.table('users')._data[owner]['couple_id'] == 'new-pair'
