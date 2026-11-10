from postgrest.exceptions import APIError

from app.core.exceptions import ConflictError


class PreferencesRepository:
    """Owner-only table. Revision comparison is performed by PostgreSQL UPDATE."""

    def __init__(self, db):
        self.db = db

    def get(self, user_id):
        response = self.db.table('user_preferences').select('*').eq('id', user_id).maybe_single().execute()
        return response.data if response else None

    def create(self, user_id, values):
        try:
            response = self.db.table('user_preferences').insert({'id': user_id, **values}).execute()
            return response.data[0]
        except APIError as error:
            if error.code != '23505':
                raise
            existing = self.get(user_id)
            if existing is None:
                raise
            return existing

    def update(self, user_id, revision, values):
        response = self.db.table('user_preferences').update(values).eq('id', user_id).eq('revision', revision).execute()
        if not response.data:
            raise ConflictError('Preferences changed; reload before saving.', code='preferences_revision_conflict')
        return response.data[0]
