"""Regression checks for combining dev private media with local auth sessions."""
import io

from PIL import Image


def test_refresh_keeps_signed_avatar_and_logout_blocks_media_writes(client, fake_db):
    registered = client.post('/api/v1/auth/register', json={
        'email': 'merge-avatar@example.com', 'password': 'Secret123', 'full_name': 'Merge Test',
    })
    assert registered.status_code == 201
    auth = registered.json()['data']
    headers = {'Authorization': 'Bearer ' + auth['access_token']}
    image = io.BytesIO()
    Image.new('RGB', (24, 32), 'blue').save(image, format='PNG')
    uploaded = client.post('/api/v1/auth/me/avatar', headers=headers,
                           files={'file': ('avatar.png', image.getvalue(), 'image/png')})
    assert uploaded.status_code == 200
    assert '/sign/flamee-media/avatars/' in uploaded.json()['data']['avatar_url']

    refreshed = client.post('/api/v1/auth/refresh', json={'refresh_token': auth['refresh_token']})
    assert refreshed.status_code == 200
    data = refreshed.json()['data']
    assert '/sign/flamee-media/avatars/' in data['user']['avatar_url']
    stored = fake_db.table('users')._data[data['user']['id']]
    assert stored['avatar_url'] is None
    assert stored['avatar_storage_path']
    assert client.get('/api/v1/auth/me', headers=headers).status_code == 401

    current = {'Authorization': 'Bearer ' + data['access_token']}
    assert client.post('/api/v1/auth/logout', headers=current).status_code == 200
    assert client.delete('/api/v1/auth/me/avatar', headers=current).status_code == 401
    assert len(fake_db.storage.buckets['flamee-media'].objects) == 1


def test_both_profile_routes_preserve_media_and_session_fields(client, alice_headers, fake_db):
    for route in ('/api/v1/auth/me', '/api/v1/users/me'):
        response = client.put(route, headers=alice_headers, json={
            'full_name': 'Updated Name', 'username': 'new-name', 'nickname': 'Display Name',
        })
        assert response.status_code == 200
        user = response.json()['data']
        assert user['full_name'] == 'Updated Name'
        assert user['username'] == 'new-name'
        assert user['nickname'] == 'Display Name'
        assert client.put(route, headers=alice_headers,
                          json={'avatar_url': 'https://untrusted.example/avatar.jpg'}).status_code == 422
    assert len(fake_db.table('auth_sessions')._data) == 1
