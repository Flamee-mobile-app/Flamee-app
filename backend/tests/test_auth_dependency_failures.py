import httpx

from app.repositories.auth_session_repo import AuthSessionRepository


def test_temporary_session_database_failure_is_not_invalid_credentials(client,alice_headers,monkeypatch):
    def unavailable(*args,**kwargs):raise httpx.ConnectError('Temporary provider outage')
    monkeypatch.setattr(AuthSessionRepository,'get_by_jti',unavailable)
    response=client.get('/api/v1/auth/me',headers=alice_headers)
    assert response.status_code==503
    assert response.json()['error']['code']=='upstream_unavailable'
