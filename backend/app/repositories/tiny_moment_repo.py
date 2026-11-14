from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError


class PrivateMomentRepository:
    def __init__(self, db):
        self.db = db

    def current_pair(self,user_id):
        user=self.db.table('users').select('couple_id').eq('id',user_id).maybe_single().execute()
        pair=user.data.get('couple_id') if user and user.data else None
        couple=self.db.table('couples').select('*').eq('id',pair).maybe_single().execute() if pair else None
        if not couple or not couple.data or couple.data.get('status')!='active' or user_id not in (couple.data.get('partner1_id'),couple.data.get('partner2_id')):
            return None
        members=self.db.table('users').select('id').in_('id',[couple.data['partner1_id'],couple.data['partner2_id']]).eq('couple_id',pair).execute().data
        return pair if len(members or [])==2 else None

    def mutate(self, owner, couple, moment_id, action, payload=None):
        result = self.db.rpc('mutate_tiny_moment', {'p_user_id': owner, 'p_couple_id': couple,
            'p_moment_id': moment_id, 'p_action': action, 'p_payload': payload or {}}).execute().data
        outcome = result.get('outcome') if isinstance(result, dict) else None
        if outcome == 'forbidden':
            raise ForbiddenError('Moment unavailable')
        if outcome == 'not_found':
            raise NotFoundError('Moment unavailable')
        if outcome == 'conflict':
            raise ConflictError('Moment request changed', code='moment_conflict')
        if outcome != 'ok':
            raise RuntimeError('Invalid Moment acknowledgement')
        return result['moment']

    def list(self, couple, limit, offset):
        return self.db.table('tiny_moments').select('*').eq('couple_id', couple).is_('deleted_at','null').order('created_at', desc=True).range(offset, offset + limit - 1).execute().data or []


class PrivateMediaRepository:
    def __init__(self,db):self.db=db

    def get(self,media_id):
        response=self.db.table('tiny_moment_media').select('*').eq('id',media_id).maybe_single().execute()
        return response.data if response else None

    def cleanup_candidates(self, before, limit):
        return self.db.table('tiny_moment_media').select('id,owner_id').is_('claimed_by','null').lt('created_at',before).order('created_at').limit(limit).execute().data or []

    def list(self,pair,ids):
        return self.db.table('tiny_moment_media').select('*').eq('couple_id',pair).in_('id',ids).execute().data if ids else []

    def create(self,fields):
        response=self.db.table('tiny_moment_media').insert(fields).execute()
        if not response.data:raise RuntimeError('Missing media acknowledgement')
        return response.data[0]

    def finalize(self,media_id,owner):
        result=self.db.rpc('finalize_tiny_moment_media',{'p_user_id':owner,'p_media_id':media_id}).execute().data
        if not isinstance(result,dict):raise RuntimeError('Missing upload acknowledgement')
        if result.get('outcome')=='forbidden':raise ForbiddenError('Connection changed')
        if result.get('outcome')!='ok':raise ConflictError('Upload was cancelled')
        return result['media']

    def remove(self,media_id,owner):
        self.db.table('tiny_moment_media').delete().eq('id',media_id).eq('owner_id',owner).execute()

    def discard(self,media_id,owner):
        result=self.db.rpc('discard_tiny_moment_media',{'p_user_id':owner,'p_media_id':media_id}).execute().data
        if not isinstance(result,dict) or result.get('outcome') not in ('ok','missing'):
            raise ForbiddenError('Media is already sent or belongs to another account')
        return result.get('media')
