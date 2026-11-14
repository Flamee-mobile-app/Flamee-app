from datetime import datetime, timezone


def mutate(db, params):
    owner, pair, moment_id, action, payload = (params[key] for key in ['p_user_id','p_couple_id','p_moment_id','p_action','p_payload'])
    couple = db.table('couples')._data.get(pair)
    users = db.table('users')._data
    if not couple or couple['status'] != 'active' or owner not in (couple['partner1_id'],couple['partner2_id']) or any(users[member].get('couple_id') != pair for member in (couple['partner1_id'],couple['partner2_id'])):
        return {'outcome':'forbidden'}
    rows = db.table('tiny_moments')._data
    row = rows.get(moment_id)
    if row:
        if row['couple_id'] != pair or owner not in (row['sender_id'],row.get('receiver_id')):
            return {'outcome':'forbidden'}
        if action=='delete' and owner==row['sender_id'] and row.get('deleted_at'):
            return {'outcome':'ok','moment':dict(row)}
        if row.get('deleted_at'): return {'outcome':'not_found'}
        if action=='create':
            if row['sender_id']!=owner or row.get('request_fingerprint')!=payload['fingerprint']: return {'outcome':'conflict'}
        elif action=='delete':
            if row['sender_id']!=owner:return {'outcome':'forbidden'}
            row.update(deleted_at=datetime.now(timezone.utc).isoformat(),content=None,reaction=None)
        elif action in ('read','react'):
            if row['receiver_id']!=owner:return {'outcome':'forbidden'}
            if action=='read':row['read_at']=row.get('read_at') or datetime.now(timezone.utc).isoformat()
            else:row['reaction']=payload['reaction']
        return {'outcome':'ok','moment':dict(row)}
    if action!='create':return {'outcome':'not_found'}
    if payload.get('nudge_id'):
        nudge=db.table('smart_nudges')._data.get(payload['nudge_id'])
        if not nudge or nudge['couple_id']!=pair or nudge['receiver_id']!=owner or nudge['status']!='new':return {'outcome':'not_found'}
    if payload.get('reply_to'):
        parent=rows.get(payload['reply_to'])
        if not parent or parent['couple_id']!=pair or parent.get('deleted_at'):return {'outcome':'not_found'}
    if payload.get('media_id'):
        media=db.table('tiny_moment_media')._data.get(payload['media_id'])
        if not media or not media.get('ready_at') or media['owner_id']!=owner or media['couple_id']!=pair or media['kind']!=payload['moment_type'] or media.get('claimed_by') or media.get('discarded_at'):return {'outcome':'not_found'}
        media['claimed_by']=moment_id
    row={**payload,'id':moment_id,'couple_id':pair,'sender_id':owner,'receiver_id':couple['partner2_id'] if owner==couple['partner1_id'] else couple['partner1_id'],
         'created_at':datetime.now(timezone.utc).isoformat(),'request_fingerprint':payload['fingerprint'],'reaction':None,'read_at':None,'deleted_at':None}
    rows[moment_id]=row
    if payload.get('nudge_id'):
        nudge.update(status='completed',version=nudge['version']+1)
    return {'outcome':'ok','moment':dict(row)}
