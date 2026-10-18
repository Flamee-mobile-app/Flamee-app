from hashlib import sha256
from unittest.mock import patch

from app.core.security import create_access_token, decode_token


def register(client):
    response = client.post('/api/v1/auth/register', json={
        'email': 'security@example.com', 'password': 'Secret123', 'full_name': 'Test',
    })
    assert response.status_code == 201
    return response.json()['data']


def test_refresh_is_hashed_and_replay_rejected(client, fake_db):
    data = register(client)
    rows = fake_db.table('auth_sessions')._data
    session = next(iter(rows.values()))
    assert session['refresh_token'] == sha256(data['refresh_token'].encode()).hexdigest()
    payload = {'refresh_token': data['refresh_token']}
    refreshed = client.post('/api/v1/auth/refresh', json=payload)
    assert refreshed.status_code == 200
    assert client.post('/api/v1/auth/refresh', json=payload).status_code == 401
    assert client.get('/api/v1/auth/me', headers={
        'Authorization': 'Bearer ' + data['access_token'],
    }).status_code == 401
    assert client.get('/api/v1/auth/me', headers={
        'Authorization': 'Bearer ' + refreshed.json()['data']['access_token'],
    }).status_code == 200


def test_expired_refresh_rejected(client, fake_db):
    data = register(client)
    next(iter(fake_db.table('auth_sessions')._data.values()))['refresh_expires_at'] = '2000-01-01T00:00:00+00:00'
    assert client.post('/api/v1/auth/refresh', json={
        'refresh_token': data['refresh_token'],
    }).status_code == 401


def test_missing_or_unavailable_session_store_fails_closed(client, fake_db):
    data = register(client)
    headers = {'Authorization': 'Bearer ' + data['access_token']}
    with patch('app.api.deps.AuthSessionRepository.get_by_jti', side_effect=RuntimeError('offline')):
        assert client.get('/api/v1/auth/me', headers=headers).status_code == 401
    fake_db.table('auth_sessions')._data.clear()
    assert client.get('/api/v1/auth/me', headers=headers).status_code == 401


def test_session_must_belong_to_token_subject(client):
    data = register(client)
    claims = decode_token(data['access_token'])
    token, _, _ = create_access_token('different-user', jti=claims['jti'])
    assert client.get('/api/v1/auth/me', headers={
        'Authorization': 'Bearer ' + token,
    }).status_code == 401
