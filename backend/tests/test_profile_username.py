import pytest
from fastapi.testclient import TestClient


def test_register_username_is_optional_for_existing_clients(client: TestClient):
    response = client.post('/api/v1/auth/register', json={
        'email': 'nickname@example.com', 'password': 'Secret123', 'full_name': 'Full Name',
    })
    assert response.status_code == 201
    assert response.json()['data']['user']['username'] is None


@pytest.mark.parametrize('endpoint', ['/api/v1/users/me', '/api/v1/auth/me'])
def test_username_roundtrip_preserves_name_and_supports_clearing(client: TestClient, endpoint: str):
    registered = client.post('/api/v1/auth/register', json={
        'email': 'nickname@example.com', 'password': 'Secret123',
        'full_name': 'Full Name', 'username': '  Huy nhỏ  ',
    })
    assert registered.status_code == 201
    assert registered.json()['data']['user']['username'] == 'Huy nhỏ'
    logged_in = client.post('/api/v1/auth/login', json={
        'email': 'nickname@example.com', 'password': 'Secret123',
    }).json()['data']
    assert logged_in['user']['username'] == 'Huy nhỏ'
    headers = {'Authorization': f"Bearer {logged_in['access_token']}"}
    assert client.get(endpoint, headers=headers).json()['data']['username'] == 'Huy nhỏ'
    changed = client.put(endpoint, headers=headers, json={'username': '  Bé Mây  '})
    assert changed.status_code == 200
    assert changed.json()['data']['username'] == 'Bé Mây'
    assert changed.json()['data']['full_name'] == 'Full Name'
    for body in [{}, {'username': None}]:
        unchanged = client.put(endpoint, headers=headers, json=body)
        assert unchanged.status_code == 200
        assert unchanged.json()['data']['username'] == 'Bé Mây'
    other_endpoint = '/api/v1/auth/me' if endpoint == '/api/v1/users/me' else '/api/v1/users/me'
    assert client.get(other_endpoint, headers=headers).json()['data']['username'] == 'Bé Mây'
    cleared = client.put(endpoint, headers=headers, json={'username': '   '})
    assert cleared.status_code == 200
    assert cleared.json()['data']['username'] is None
    assert client.get(other_endpoint, headers=headers).json()['data']['username'] is None


@pytest.mark.parametrize('endpoint', ['/api/v1/users/me', '/api/v1/auth/me'])
def test_username_limit_is_validated_after_trimming(client: TestClient, alice_headers, endpoint: str):
    valid = client.put(endpoint, headers=alice_headers, json={'username': '  ' + 'a' * 40 + '  '})
    assert valid.status_code == 200
    assert valid.json()['data']['username'] == 'a' * 40
    invalid = client.put(endpoint, headers=alice_headers, json={'username': 'a' * 41})
    assert invalid.status_code == 422


def test_registration_rejects_username_over_limit(client: TestClient):
    response = client.post('/api/v1/auth/register', json={
        'email': 'nickname@example.com', 'password': 'Secret123',
        'full_name': 'Full Name', 'username': 'a' * 41,
    })
    assert response.status_code == 422


def test_username_changes_only_token_owner_and_allows_shared_nicknames(client: TestClient, alice_headers, bob_headers):
    bob = client.get('/api/v1/users/me', headers=bob_headers).json()['data']
    changed = client.put('/api/v1/users/me', headers=alice_headers, json={
        'username': 'Mây', 'user_id': bob['id'],
    })
    assert changed.status_code == 200
    assert changed.json()['data']['username'] == 'Mây'
    assert client.get('/api/v1/users/me', headers=bob_headers).json()['data']['username'] is None
    same_name = client.put('/api/v1/users/me', headers=bob_headers, json={'username': 'Mây'})
    assert same_name.status_code == 200
    assert same_name.json()['data']['username'] == 'Mây'


@pytest.mark.parametrize('endpoint', ['/api/v1/users/me', '/api/v1/auth/me'])
def test_username_update_requires_authentication(client: TestClient, endpoint: str):
    assert client.put(endpoint, json={'username': 'Mây'}).status_code == 401
