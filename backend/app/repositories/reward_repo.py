from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError


class RewardRepository:
    def __init__(self,db):self.db=db

    def is_operator(self,user_id):
        result=self.db.table('mission_operators').select('user_id').eq('user_id',user_id).eq('active',True).maybe_single().execute()
        return bool(result and result.data)

    def execute(self,user_id,action,target=None,key=None,payload=None):
        result=self.db.rpc('reward_operation',{'p_user':user_id,'p_action':action,'p_target':target,'p_key':key,'p_payload':payload or {}}).execute().data
        if not isinstance(result,dict):raise RuntimeError('Missing reward acknowledgement')
        if result.get('outcome')=='forbidden':raise ForbiddenError('Reward operation is not permitted')
        if result.get('outcome')=='not_found':raise NotFoundError('Reward not found')
        if result.get('outcome')=='conflict':raise ConflictError('Reward, balance or stock changed; refresh before retrying')
        if result.get('outcome')!='ok':raise RuntimeError('Invalid reward acknowledgement')
        return result['data']

    def expired(self,before,limit=100):
        return self.db.table('mission_redemptions').select('id').in_('status',['pending_fulfillment','review']).lte('expires_at',before).order('expires_at').limit(limit).execute().data or []
