from fastapi.testclient import TestClient


def test_recovery_never_returns_a_mock_otp_or_changes_password(client: TestClient):
    registration = client.post('/api/v1/auth/register', json={
        'email': 'recovery@example.com', 'password': 'Secret123', 'full_name': 'An',
    })
    assert registration.status_code == 201
    for path, payload in [
        ('forgot-password', {'email': 'recovery@example.com'}),
        ('reset-password', {'email': 'recovery@example.com', 'otp': '123456', 'new_password': 'Changed123'}),
    ]:
        response = client.post(f'/api/v1/auth/{path}', json=payload)
        assert response.status_code == 501
        assert 'otp' not in response.json().get('data', {})
        assert '123456' not in response.text
    assert client.post('/api/v1/auth/login', json={
        'email': 'recovery@example.com', 'password': 'Secret123',
    }).status_code == 200
    assert client.post('/api/v1/auth/login', json={
        'email': 'recovery@example.com', 'password': 'Changed123',
    }).status_code == 401
