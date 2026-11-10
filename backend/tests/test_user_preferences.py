import pytest
from pathlib import Path
import re


ROOT = '/api/v1/users/me/preferences'


def test_preferences_foreign_key_matches_existing_user_id_type():
    backend = Path(__file__).resolve().parents[1]
    schema = (backend / 'schema.sql').read_text(encoding='utf-8')
    migration = (backend / 'migrations/20261110_user_preferences.sql').read_text(encoding='utf-8')
    parent = re.search(r'CREATE TABLE users\s*\(\s*id\s+(\w+)', schema).group(1)
    child = re.search(r'CREATE TABLE IF NOT EXISTS public.user_preferences\s*\(\s*id\s+(\w+)', migration).group(1)
    assert child.upper() == parent.upper()


def test_preferences_require_authentication(client):
    assert client.get(ROOT).status_code == 401
    assert client.put(ROOT, json={}).status_code == 401


def test_missing_preferences_table_reports_migration_required(client, alice_headers, monkeypatch):
    from postgrest.exceptions import APIError
    from app.repositories.preferences_repo import PreferencesRepository
    def missing(*args):
        raise APIError({'code': 'PGRST205', 'message': 'missing table', 'details': '', 'hint': ''})
    monkeypatch.setattr(PreferencesRepository, 'get', missing)
    response = client.get(ROOT, headers=alice_headers)
    assert response.status_code == 503
    assert response.json()['error']['code'] == 'database_migration_required'


def test_database_transport_failure_is_sanitized_and_not_retried(client, alice_headers, monkeypatch):
    import httpx
    from app.repositories.preferences_repo import PreferencesRepository
    calls = []
    def unavailable(*args):
        calls.append(1)
        raise httpx.ReadError('sensitive connection diagnostics')
    monkeypatch.setattr(PreferencesRepository, 'get', unavailable)
    response = client.get(ROOT, headers=alice_headers)
    assert response.status_code == 503
    assert response.json()['error']['code'] == 'upstream_unavailable'
    assert 'sensitive' not in response.text and len(calls) == 1


def test_preferences_roundtrip_owner_and_revision(client, alice_headers, bob_headers):
    initial = client.get(ROOT, headers=alice_headers)
    assert initial.status_code == 200
    saved = initial.json()['data']
    assert saved['revision'] == 0
    assert saved['onboarding_completed_at'] is None
    body = {key: saved[key] for key in ['revision', 'timezone', 'locale', 'care_preferences', 'care_note', 'partner_nickname', 'relationship_type']}
    body.update(timezone='Asia/Tokyo', locale='en', care_preferences=['voice', 'space'],
                care_note='private care note', partner_nickname='Moon', relationship_type='long_distance', complete_onboarding=True)
    result = client.put(ROOT, headers=alice_headers, json=body)
    assert result.status_code == 200
    confirmed = result.json()['data']
    assert confirmed['revision'] == 1
    assert confirmed['care_note'] == body['care_note']
    assert confirmed['onboarding_completed_at']
    assert client.get(ROOT, headers=alice_headers).json()['data'] == confirmed
    other = client.get(ROOT, headers=bob_headers).json()['data']
    assert other['care_preferences'] == [] and other['care_note'] == ''
    assert other['onboarding_completed_at'] is None
    assert client.put(ROOT, headers=alice_headers, json=body).status_code == 409
    body.update(revision=1, care_note='', care_preferences=[], partner_nickname='', complete_onboarding=False)
    cleared = client.put(ROOT, headers=alice_headers, json=body).json()['data']
    assert cleared['revision'] == 2 and cleared['care_note'] == ''
    assert cleared['onboarding_completed_at'] == confirmed['onboarding_completed_at']


@pytest.mark.parametrize('patch', [
    {'timezone': 'Moon/Sea'}, {'locale': 'xx'}, {'care_preferences': ['unknown']},
    {'care_preferences': ['voice', 'voice']}, {'care_note': 'x' * 141},
    {'partner_nickname': 'x' * 41}, {'relationship_type': 'invalid'},
    {'revision': -1}, {'user_id': 'other'}, {'onboarding_completed_at': 'forged'},
    {'complete_onboarding': True},
])
def test_preferences_validation(client, alice_headers, patch):
    body = {'revision': 0, 'timezone': 'UTC', 'locale': 'vi', 'care_preferences': [],
            'care_note': '', 'partner_nickname': '', 'relationship_type': None, 'complete_onboarding': False}
    assert client.put(ROOT, headers=alice_headers, json=body | patch).status_code == 422
