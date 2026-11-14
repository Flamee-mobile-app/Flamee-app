import pytest
from tests.test_smart_nudge_state import _pair, _create_nudge


def paired(client, alice_headers, bob_headers):
    _pair(client, alice_headers, bob_headers)


def post(client, headers, body, key='moment-one'):
    return client.post('/api/v1/tiny-moments', headers={**headers, 'Idempotency-Key': key}, json=body)


def test_moment_text_retry_detail_reply_read_reaction_delete(client, alice_headers, bob_headers):
    paired(client, alice_headers, bob_headers)
    body = {'moment_type': 'text', 'content': 'A real message'}
    first = post(client, alice_headers, body)
    assert first.status_code == 201
    moment = first.json()['data']
    assert post(client, alice_headers, body).json()['data']['id'] == moment['id']
    assert post(client, alice_headers, body | {'content': 'Changed'}).status_code == 409
    path = '/api/v1/tiny-moments/' + moment['id']
    assert client.get(path, headers=bob_headers).json()['data']['content'] == body['content']
    assert client.post(path + '/read', headers=bob_headers).status_code == 200
    assert client.post(path + '/reactions', headers=bob_headers, json={'reaction': 'heart'}).status_code == 200
    assert client.get(path, headers=alice_headers).json()['data']['reaction'] == 'heart'
    reply = post(client, bob_headers, {'moment_type': 'signal', 'content': 'thinking_of_you', 'reply_to': moment['id']}, key='reply-one')
    assert reply.status_code == 201 and reply.json()['data']['reply_to'] == moment['id']
    assert client.delete(path, headers=bob_headers).status_code == 403
    assert client.delete(path, headers=alice_headers).status_code == 204
    assert client.delete(path, headers=alice_headers).status_code == 204
    assert client.get(path, headers=bob_headers).status_code == 404
    assert post(client, bob_headers, {'moment_type': 'text', 'content': 'Late', 'reply_to': moment['id']}, key='late-reply').status_code == 404


@pytest.mark.parametrize('body', [
    {'moment_type': 'text', 'content': 'x' * 201},
    {'moment_type': 'text', 'content': '   '},
    {'moment_type': 'signal', 'content': 'arbitrary signal'},
    {'moment_type': 'photo', 'content': 'https://arbitrary.example/file'},
    {'moment_type': 'voice', 'content': 'file://local.m4a'},
    {'moment_type': 'text', 'content': 'A', 'couple_id': 'forged'},
])
def test_moment_contract_rejects_fake_media_and_invalid_content(client, alice_headers, bob_headers, body):
    paired(client, alice_headers, bob_headers)
    assert post(client, alice_headers, body).status_code == 422


def test_moment_isolation_and_nudge_binding(client, alice_headers, bob_headers, fake_db):
    paired(client, alice_headers, bob_headers)
    assert post(client, alice_headers, {'moment_type': 'text', 'content': 'A', 'nudge_id': 'foreign-nudge'}).status_code == 404
    saved = post(client, alice_headers, {'moment_type': 'text', 'content': 'Private couple'}, key='private-couple').json()['data']
    owner = client.get('/api/v1/auth/me', headers=bob_headers).json()['data']['id']
    fake_db.table('users')._data[owner]['couple_id'] = None
    assert client.get('/api/v1/tiny-moments/' + saved['id'], headers=bob_headers).status_code == 403


def test_linked_moment_completes_receiver_nudge_only_after_server_ack(client,alice_headers,bob_headers):
    paired(client,alice_headers,bob_headers)
    nudge_id=_create_nudge(client,alice_headers,bob_headers)
    body={'moment_type':'text','content':'For you','nudge_id':nudge_id}
    assert post(client,alice_headers,body).status_code==404
    result=post(client,bob_headers,body,key='linked')
    assert result.status_code==201
    assert client.get('/api/v1/nudges/'+nudge_id,headers=bob_headers).json()['data']['status']=='completed'
    assert post(client,bob_headers,body,key='linked').json()['data']['id']==result.json()['data']['id']


def test_deleted_rows_do_not_hide_older_moments_in_paginated_feed(client,alice_headers,bob_headers):
    paired(client,alice_headers,bob_headers)
    kept=post(client,alice_headers,{'moment_type':'text','content':'Keep'},key='keep').json()['data']
    deleted=post(client,alice_headers,{'moment_type':'text','content':'Remove'},key='remove').json()['data']
    assert client.delete('/api/v1/tiny-moments/'+deleted['id'],headers=alice_headers).status_code==204
    feed=client.get('/api/v1/tiny-moments?limit=1',headers=bob_headers).json()['data']
    assert [row['id'] for row in feed]==[kept['id']]
