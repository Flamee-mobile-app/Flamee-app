from app.core.exceptions import ConflictError, FeatureUnavailableError, ForbiddenError, NotFoundError


class MissionRepository:
    def __init__(self, db):
        self.db = db

    def execute(self, user_id, action, target=None, key=None, payload=None):
        result = self.db.rpc('mission_operation', {'p_user': user_id, 'p_action': action,
            'p_target': target, 'p_key': key, 'p_payload': payload or {}}).execute().data
        if not isinstance(result, dict):
            raise RuntimeError('Missing mission acknowledgement')
        outcome = result.get('outcome')
        if outcome == 'forbidden':
            raise ForbiddenError('Mission unavailable for this account')
        if outcome == 'not_found':
            raise NotFoundError('Mission not found')
        if outcome == 'conflict':
            raise ConflictError('Mission changed; refresh before retrying')
        if outcome == 'unavailable':
            raise FeatureUnavailableError('Mission configuration is unavailable')
        if outcome != 'ok':
            raise RuntimeError('Invalid mission acknowledgement')
        return result['data']
