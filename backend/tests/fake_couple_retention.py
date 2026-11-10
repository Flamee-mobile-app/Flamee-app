"""Test adapter for dissolve_couple SQL; never used in application runtime."""
from datetime import datetime, timedelta, timezone


def dissolve(db, params):
    couple = db.table('couples')._data.get(params['p_couple_id'])
    if not couple or params['p_user_id'] not in (couple['partner1_id'], couple['partner2_id']):
        return {'outcome': 'forbidden'}
    if couple['status'] != 'dissolved':
        users = db.table('users')._data
        if users[params['p_user_id']].get('couple_id') != couple['id']:
            return {'outcome': 'forbidden'}
        now = datetime.now(timezone.utc)
        couple.update(status='dissolved', dissolved_at=now.isoformat(), purge_after=(now + timedelta(days=30)).isoformat())
        for user in users.values():
            if user['id'] in (couple['partner1_id'], couple['partner2_id']) and user.get('couple_id') == couple['id']:
                user['couple_id'] = None
        for invite in db.table('invite_codes')._data.values():
            if invite['user_id'] in (couple['partner1_id'], couple['partner2_id']) and invite['status'] == 'pending':
                invite['status'] = 'cancelled'
    return {'outcome': 'dissolved', 'couple_id': couple['id'], **{key: couple[key] for key in ('status', 'dissolved_at', 'purge_after')}}
