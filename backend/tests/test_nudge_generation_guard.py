from datetime import datetime, timedelta, timezone
from uuid import uuid4

from app.models.smart_nudge import SmartNudge
from app.repositories.smart_nudge_repo import SmartNudgeRepository
from tests.test_smart_nudge_state import _pair


def payload(client, headers, couple_id):
    user = client.get('/api/v1/auth/me', headers=headers).json()['data']['id']
    return SmartNudge(id=str(uuid4()), couple_id=couple_id, receiver_id=user, status='new',
                      observation='A', action_type='text', draft='B', reason='C', tone='gentle',
                      created_at=datetime.now(timezone.utc).isoformat()).to_dict()


def test_guard_prevents_double_create_after_both_callers_pass_preflight(client, alice_headers, bob_headers, fake_db):
    _pair(client, alice_headers, bob_headers)
    pair = client.get('/api/v1/couple', headers=bob_headers).json()['data']['id']
    fields = payload(client, bob_headers, pair)
    repo = SmartNudgeRepository(fake_db)
    assert repo.create_guarded(fields) is not None
    assert repo.create_guarded({**fields, 'id': str(uuid4())}) is None
    assert len(fake_db.table('smart_nudges')._data) == 1


def test_guard_daily_quota_and_membership(client, alice_headers, bob_headers, fake_db):
    _pair(client, alice_headers, bob_headers)
    pair = client.get('/api/v1/couple', headers=bob_headers).json()['data']['id']
    fields = payload(client, bob_headers, pair)
    rows = fake_db.table('smart_nudges')._data
    now = datetime.now(timezone.utc)
    # Three prior records in today's receiver-local day, outside cooldown.
    from zoneinfo import ZoneInfo
    local = now.astimezone(ZoneInfo('Asia/Ho_Chi_Minh'))
    yesterday = (local.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(seconds=1)).astimezone(timezone.utc)
    for index in range(3):
        row = {**fields, 'id': str(uuid4()), 'created_at': now.isoformat(), 'status': 'completed'}
        rows[row['id']] = row
    repo = SmartNudgeRepository(fake_db)
    assert repo.create_guarded(fields) is None
    for row in rows.values():
        row['created_at'] = min(yesterday, now - timedelta(hours=5)).isoformat()
    assert repo.create_guarded(fields) is not None
    fake_db.table('users')._data[fields['receiver_id']]['couple_id'] = None
    assert repo.create_guarded({**fields, 'id': str(uuid4())}) is None
