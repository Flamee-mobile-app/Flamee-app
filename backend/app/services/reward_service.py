from app.core.exceptions import ForbiddenError, ValidationError


class RewardService:
    def __init__(self,repository):self.repository=repository

    def operator(self,user_id):
        if not self.repository.is_operator(user_id):raise ForbiddenError('Operator role required')

    def run(self,user_id,action,target=None,key=None,payload=None):
        if action.startswith('admin_'):self.operator(user_id)
        if action in ('redeem','admin_create','admin_update'):
            price=(payload or {}).get('expected_price' if action=='redeem' else 'price_points')
            if type(price) is not int or price < 100:
                raise ValidationError('Rewards require at least 100 points')
        result=self.repository.execute(user_id,action,target,key,payload)
        if action in ('redeem','cancel','admin_fulfill','expire') and isinstance(result,dict):
            from app.services.websocket_service import ws_manager
            ws_manager.sync_broadcast_to_couple(result['couple_id'],'wallet.updated',{'id':result['couple_id']})
        return result
