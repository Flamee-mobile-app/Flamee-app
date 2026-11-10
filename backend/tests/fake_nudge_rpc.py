"""Test-only RPC adapter; production always executes the PostgreSQL function."""
from datetime import datetime, timedelta, timezone
from hashlib import md5
from zoneinfo import ZoneInfo


def create_nudge(db, fields):
    couple = db.table('couples')._data.get(fields['couple_id'])
    members = (couple.get('partner1_id'), couple.get('partner2_id')) if couple else ()
    users = db.table('users')._data
    if not couple or couple.get('status') != 'active' or fields['receiver_id'] not in members or any(users.get(member, {}).get('couple_id') != fields['couple_id'] for member in members):
        return {'outcome': 'suppressed'}
    if fields.get('partner_id') and (fields['partner_id'] not in members or fields['partner_id'] == fields['receiver_id']):
        return {'outcome': 'suppressed'}
    now = datetime.now(timezone.utc)
    zone = ZoneInfo(users[fields['receiver_id']].get('timezone') or 'UTC')
    day_start = now.astimezone(zone).replace(hour=0, minute=0, second=0, microsecond=0)
    rows = db.table('smart_nudges')._data
    previous = [datetime.fromisoformat(row['created_at'].replace('Z', '+00:00')) for row in rows.values() if row['receiver_id'] == fields['receiver_id'] and row['couple_id'] == fields['couple_id']]
    if sum(created >= day_start for created in previous) >= 3 or any(created > now - timedelta(hours=4) for created in previous):
        return {'outcome': 'suppressed'}
    row = {**fields, 'created_at': now.isoformat(), 'expires_at': (now + timedelta(hours=24)).isoformat(), 'version': 1, 'snooze_count': 0, 'status': 'new', 'snoozed_until': None}
    rows[row['id']] = row
    return {'outcome': 'created', 'nudge': dict(row)}


def mutate_nudge(db, p):
    row = db.table('smart_nudges')._data.get(p['p_nudge_id'])
    if not row:
        return {'outcome': 'not_found'}
    couple = db.table('couples')._data.get(row['couple_id'])
    members = (couple.get('partner1_id'), couple.get('partner2_id')) if couple else ()
    users = db.table('users')._data
    if not couple or couple.get('status') != 'active' or row['receiver_id'] != p['p_user_id'] or p['p_user_id'] not in members or any(users.get(member, {}).get('couple_id') != row['couple_id'] for member in members):
        return {'outcome': 'forbidden'}
    now = datetime.now(timezone.utc)
    action = p['p_action']
    version = p.get('p_version')
    if action == 'rate':
        rows = db.table('smart_nudge_ratings')._data
        existing = next((r for r in rows.values() if r['nudge_id'] == row['id'] and r['user_id'] == p['p_user_id']), None)
        if existing is None:
            rating_id = 'rating:' + md5((row['id'] + ':' + p['p_user_id']).encode()).hexdigest()
            existing = {'id': rating_id, 'nudge_id': row['id'], 'user_id': p['p_user_id'], 'created_at': now.isoformat()}
            rows[rating_id] = existing
        existing.update(rating=p['p_rating'], feedback_reason=p.get('p_feedback'))
    elif row['status'] in ('completed', 'dismissed'):
        if row['status'] != action:
            return {'outcome': 'terminal'}
    elif row['status'] == 'expired' or row.get('expires_at') and datetime.fromisoformat(row['expires_at'].replace('Z', '+00:00')) <= now:
        return {'outcome': 'expired'}
    elif action == 'snoozed' and version is not None and row['version'] == version + 1 and row['snooze_count'] == 1 and datetime.fromisoformat(row['snoozed_until']) > now:
        pass
    elif version is not None and version != row['version']:
        return {'outcome': 'conflict'}
    elif action == 'snoozed' and row.get('snooze_count', 0) >= 1:
        return {'outcome': 'snooze_limit'}
    else:
        row.update(status='new' if action == 'snoozed' else action, version=row['version'] + 1)
        if action == 'snoozed':
            row.update(snooze_count=1, snoozed_until=(now + timedelta(hours=2)).isoformat())
    return {'outcome': 'ok', 'nudge': dict(row)}
