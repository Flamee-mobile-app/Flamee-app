class MissionService:
    def __init__(self, repository):
        self.repository = repository

    def read(self, user_id, action, *, limit=20, offset=0):
        return self.repository.execute(user_id, action, payload={'limit': limit, 'offset': offset})

    def change(self, user_id, action, target, key, payload):
        result = self.repository.execute(user_id, action, target, key, payload)
        from app.services.websocket_service import ws_manager
        pair = result.get('couple_id') if isinstance(result, dict) else None
        if pair:
            ws_manager.sync_broadcast_to_couple(pair, 'mission.updated', {'id': target or pair})
        return result
