from datetime import datetime, timedelta, timezone

from tests.test_smart_nudge_state import _pair, _create_nudge


def make_nudge(client, alice_headers, bob_headers):
    _pair(client, alice_headers, bob_headers)
    return _create_nudge(client, alice_headers, bob_headers)


def test_detail_requires_current_receiver(client, alice_headers, bob_headers, fake_db):
    nudge_id = make_nudge(client, alice_headers, bob_headers)
    path = '/api/v1/nudges/' + nudge_id
    assert client.get(path).status_code == 401
    assert client.get(path, headers=alice_headers).status_code == 403
    assert client.get(path, headers=bob_headers).status_code == 200
    user = client.get('/api/v1/auth/me', headers=bob_headers).json()['data']
    fake_db.table('users')._data[user['id']]['couple_id'] = None
    assert client.get(path, headers=bob_headers).status_code == 403
    assert client.post(path + '/action', headers=bob_headers, json={'action': 'completed'}).status_code == 403
    assert client.post(path + '/rate', headers=bob_headers, json={'rating': 'thumbs_up'}).status_code == 403


def test_terminal_action_is_idempotent_and_cannot_be_reopened(client, alice_headers, bob_headers):
    nudge_id = make_nudge(client, alice_headers, bob_headers)
    path = '/api/v1/nudges/' + nudge_id + '/action'
    first = client.post(path, headers=bob_headers, json={'action': 'completed', 'version': 1})
    assert first.status_code == 200
    retry = client.post(path, headers=bob_headers, json={'action': 'completed', 'version': 1})
    assert retry.status_code == 200
    assert retry.json()['data']['version'] == first.json()['data']['version']
    assert client.post(path, headers=bob_headers, json={'action': 'dismissed', 'version': 2}).status_code == 409


def test_expired_nudge_rejects_action_and_stale_version_conflicts(client, alice_headers, bob_headers, fake_db):
    nudge_id = make_nudge(client, alice_headers, bob_headers)
    path = '/api/v1/nudges/' + nudge_id + '/action'
    assert client.post(path, headers=bob_headers, json={'action': 'completed', 'version': 5}).status_code == 409
    fake_db.table('smart_nudges')._data[nudge_id]['expires_at'] = (datetime.now(timezone.utc) - timedelta(seconds=1)).isoformat()
    assert client.post(path, headers=bob_headers, json={'action': 'completed'}).status_code == 409


def test_rating_retry_updates_one_record(client, alice_headers, bob_headers, fake_db):
    nudge_id = make_nudge(client, alice_headers, bob_headers)
    path = '/api/v1/nudges/' + nudge_id + '/rate'
    for rating in ['thumbs_up', 'thumbs_up', 'thumbs_down']:
        assert client.post(path, headers=bob_headers, json={'rating': rating}).status_code == 200
    rows = list(fake_db.table('smart_nudge_ratings')._data.values())
    assert len(rows) == 1 and rows[0]['rating'] == 'thumbs_down'
