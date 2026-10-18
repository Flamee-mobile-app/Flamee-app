"""Run explicitly with FLAMEE_TEST_LIVE_READONLY=1; never creates remote data."""
import os
from dataclasses import fields

import httpx
import pytest

from app.config import settings
from app.models.auth_session import AuthSession
from app.models.couple import Couple, InviteCode
from app.models.memory import Memory, MemoryImage
from app.models.mood import Mood, MoodAlert
from app.models.smart_nudge import SmartNudge, TinyMoment
from app.models.user import User

pytestmark = [
    pytest.mark.live_readonly,
    pytest.mark.skipif(os.getenv('FLAMEE_TEST_LIVE_READONLY') != '1', reason='Live read-only checks are opt-in'),
]


def test_live_supabase_schema_and_session_rpc():
    assert settings.supabase_url and settings.supabase_service_key, 'Supabase configuration missing'
    models = {'users': User, 'couples': Couple, 'invite_codes': InviteCode,
              'auth_sessions': AuthSession, 'memories': Memory, 'memory_images': MemoryImage,
              'moods': Mood, 'mood_alerts': MoodAlert, 'smart_nudges': SmartNudge, 'tiny_moments': TinyMoment}
    headers = {'apikey': settings.supabase_service_key, 'Authorization': 'Bearer ' + settings.supabase_service_key}
    try:
        with httpx.Client(base_url=settings.supabase_url.rstrip('/') + '/rest/v1/', headers=headers, timeout=10) as client:
            response = client.get('', headers={'Accept': 'application/openapi+json'})
            assert response.status_code == 200, f'Database schema access: HTTP {response.status_code}'
            schema = response.json()
            definitions = schema.get('definitions', {})
            missing = []
            for table, model in models.items():
                if table not in definitions:
                    missing.append('table:' + table)
                    continue
                columns = definitions[table].get('properties', {})
                expected = {f.name for f in fields(model)} - {'extra'}
                missing.extend(table + '.' + name for name in sorted(expected - set(columns)))
            for table in ('smart_nudge_ratings', 'subscription_plans', 'payment_orders', 'chat_messages', 'ai_facts'):
                if table not in definitions:
                    missing.append('table:' + table)
            for rpc in ('rotate_auth_session', 'accept_couple_invite'):
                if '/rpc/' + rpc not in schema.get('paths', {}):
                    missing.append('rpc:' + rpc)
            assert not missing, 'Missing database migrations: ' + ', '.join(missing)
            for table, model in models.items():
                columns = ','.join(f.name for f in fields(model) if f.name != 'extra')
                response = client.head(table, params={'select': columns, 'limit': '1'})
                assert response.status_code == 200, f'{table}: HTTP {response.status_code}; verify service key and migrations'
            for table in ('smart_nudge_ratings', 'subscription_plans', 'payment_orders', 'chat_messages', 'ai_facts'):
                response = client.head(table, params={'select': 'id', 'limit': '1'})
                assert response.status_code == 200, f'{table}: HTTP {response.status_code}'
            response = client.get('', headers={'Accept': 'application/openapi+json'})
            assert response.status_code == 200, 'Cannot inspect database RPC schema'
            paths = response.json().get('paths', {})
            assert '/rpc/rotate_auth_session' in paths, 'Missing rotate_auth_session RPC'
            assert '/rpc/accept_couple_invite' in paths, 'Missing accept_couple_invite RPC'
    except httpx.RequestError as exc:
        pytest.fail('Supabase connection failed: ' + type(exc).__name__, pytrace=False)


def test_live_private_media_bucket():
    headers = {'apikey': settings.supabase_service_key, 'Authorization': 'Bearer ' + settings.supabase_service_key}
    try:
        response = httpx.get(settings.supabase_url.rstrip('/') + '/storage/v1/bucket/flamee-media', headers=headers, timeout=10)
    except httpx.RequestError as exc:
        pytest.fail('Storage connection failed: ' + type(exc).__name__, pytrace=False)
    assert response.status_code == 200, f'Media bucket: HTTP {response.status_code}'
    assert response.json().get('public') is False, 'flamee-media bucket must be private'
