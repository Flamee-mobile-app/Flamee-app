from fastapi.testclient import TestClient


def test_wrong_current_password_is_validation_and_keeps_session(client: TestClient, alice_headers):
    response = client.post('/api/v1/auth/change-password', headers=alice_headers,
                           json={'current_password': 'WrongPassword', 'new_password': 'NewSecret123'})
    assert response.status_code == 400
    assert response.json()['error']['code'] == 'current_password_invalid'
    assert client.get('/api/v1/auth/me', headers=alice_headers).status_code == 200


def test_user_password_alias_uses_same_validation_contract(client: TestClient, alice_headers):
    response = client.put('/api/v1/users/me/password', headers=alice_headers,
                          json={'current_password': 'WrongPassword', 'new_password': 'NewSecret123'})
    assert response.status_code == 400
    assert response.json()['error']['code'] == 'current_password_invalid'
