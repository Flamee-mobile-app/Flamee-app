from app.core.exceptions import ForbiddenError


class RewardService:
    def __init__(self,repository):self.repository=repository

    def operator(self,user_id):
        if not self.repository.is_operator(user_id):raise ForbiddenError('Operator role required')

    def run(self,user_id,action,target=None,key=None,payload=None):
        if action.startswith('admin_'):self.operator(user_id)
        result=self.repository.execute(user_id,action,target,key,payload)
        if action in ('redeem','cancel','admin_fulfill','expire') and isinstance(result,dict):
            from app.services.websocket_service import ws_manager
            ws_manager.sync_broadcast_to_couple(result['couple_id'],'wallet.updated',{'id':result['couple_id']})
        return result
