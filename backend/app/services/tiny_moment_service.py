import hashlib
import json
from uuid import NAMESPACE_URL, uuid5

from app.core.exceptions import ForbiddenError, NotFoundError
from app.repositories.tiny_moment_repo import PrivateMomentRepository,PrivateMediaRepository
from app.services.media_storage import MediaStorage


class PrivateMomentService:
    def __init__(self, db):
        self.db = db
        self.repo = PrivateMomentRepository(db)
        self.media_repo=PrivateMediaRepository(db)

    def require_pair(self, user_id):
        pair=self.repo.current_pair(user_id)
        if not pair:
            raise ForbiddenError('Connection changed')
        return pair

    def present(self, row, media_lookup=None):
        if row.get('deleted_at'):
            raise NotFoundError('Moment deleted')
        fields = ['id', 'couple_id', 'sender_id', 'receiver_id', 'moment_type', 'content', 'reaction',
                  'nudge_id', 'reply_to', 'media_id', 'place', 'created_at', 'read_at']
        result = {field: row.get(field) for field in fields}
        result['media_url'] = None
        if row.get('media_id'):
            if media_lookup is None:
                media = self.media_repo.get(row['media_id'])
            else:
                media = media_lookup.get(row['media_id'])
            if not media or media.get('couple_id') != row['couple_id']:
                raise NotFoundError('Moment media unavailable')
            # Signed storage URLs can keep serving cached bytes after deletion.
            # Every new download must pass the active membership/entity checks.
            result['media_url'] = '/api/v1/tiny-moments/' + row['id'] + '/media'
        return result

    def media(self, user_id, moment_id):
        pair = self.require_pair(user_id)
        row = self.repo.mutate(user_id, pair, moment_id, 'get')
        media = self.media_repo.get(row.get('media_id')) if row.get('media_id') else None
        if not media or media.get('couple_id') != pair or media.get('discarded_at'):
            raise NotFoundError('Moment media unavailable')
        return MediaStorage(self.db).download(media['storage_path']), media['mime_type']

    def create(self, user_id, body, key):
        pair = self.require_pair(user_id)
        values = body.model_dump()
        if values.get('media_id'):
            asset=self.media_repo.get(values['media_id'])
            if not asset or not asset.get('ready_at'):
                raise NotFoundError('Moment media unavailable')
        values['fingerprint'] = hashlib.sha256(json.dumps(values, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
        moment_id = str(uuid5(NAMESPACE_URL, f'flamee-tiny-moment:{user_id}:{pair}:{key}'))
        row = self.repo.mutate(user_id, pair, moment_id, 'create', values)
        self.notify(pair, row['id'])
        return self.present(row)

    def get(self, user_id, moment_id):
        pair = self.require_pair(user_id)
        return self.present(self.repo.mutate(user_id, pair, moment_id, 'get'))

    def list(self, user_id, limit, offset):
        pair = self.require_pair(user_id)
        rows = self.repo.list(pair, limit, offset)
        rows = [row for row in rows if not row.get('deleted_at')]
        media_ids = list({row['media_id'] for row in rows if row.get('media_id')})
        media_rows = self.media_repo.list(pair,media_ids)
        lookup = {row['id']:row for row in media_rows}
        return [self.present(row,lookup) for row in rows]

    def change(self, user_id, moment_id, action, payload=None):
        pair = self.require_pair(user_id)
        row = self.repo.mutate(user_id, pair, moment_id, action, payload)
        self.notify(pair, moment_id)
        if action == 'delete':
            if row.get('media_id'):
                media = self.media_repo.get(row['media_id'])
                if media:
                    MediaStorage(self.db).remove([media['storage_path']])
            return None
        return self.present(row)

    def discard_media(self,user_id,media_id,*,finalize=False):
        media=self.media_repo.discard(media_id,user_id)
        if media:
            MediaStorage(self.db).remove([media['storage_path']])
            # Keep cancellation tombstones until the aged cleanup pass, so an
            # in-flight PUT cannot leave an untracked object after cancellation.
            if finalize:self.media_repo.remove(media_id,user_id)

    @staticmethod
    def notify(pair, moment_id):
        from app.services.websocket_service import ws_manager
        ws_manager.sync_broadcast_to_couple(pair, 'tiny_moment.updated', {'id': moment_id})
