"""Explicit development-only acceptance against the real database and storage.

Keeps synthetic accounts/records; evidence never contains credentials or URLs.
"""
import io
import json
import os
from pathlib import Path
import secrets
import wave
from datetime import datetime, timedelta, timezone

from PIL import Image
import pytest
from fastapi.testclient import TestClient

pytestmark = [pytest.mark.live_workflow, pytest.mark.skipif(
    os.getenv('FLAMEE_TEST_LIVE_WORKFLOW') != '1', reason='Development data writes require opt-in')]


def test_real_private_moments_and_retention(monkeypatch):
    from app.config import settings
    from app.main import create_app
    assert settings.debug, 'Development only'
    run = 'moment-' + secrets.token_hex(5)
    report = {'run_id': run, 'checks': [], 'complete': False}
    output = Path(__file__).resolve().parents[2] / 'docs/progress/2026-11-10-browser-e2e' / run
    output.mkdir(parents=True)
    password = secrets.token_urlsafe(24) + 'Aa1!'
    try:
        with TestClient(create_app()) as api:
            def call(method, path, actor=None, expected=200, key=None, **kwargs):
                headers = {'Authorization': 'Bearer ' + actor['access_token']} if actor else {}
                if key:
                    headers['Idempotency-Key'] = key
                response = api.request(method, '/api/v1' + path, headers=headers, **kwargs)
                assert response.status_code == expected, f'{method} {path}: {response.status_code}, expected {expected}'
                if expected >= 400 or expected == 204:
                    return None
                return response.json()['data']

            a, b, c = [call('POST', '/auth/register', expected=201, json={
                'email': f'{run}-{index}@example.com', 'password': password,
                'full_name': f'Moment acceptance {index}'}) for index in range(3)]
            invite = call('POST', '/couple/invite-code', a, 201)
            pair = call('POST', '/couple/accept-invite', b, json={'code': invite['code']})
            report['couple_id'] = pair['id']
            report['checks'].append('three real accounts; A/B paired; C isolated')
            body = {'moment_type': 'text', 'content': 'Development acceptance ' + run}
            moment = call('POST', '/tiny-moments', a, 201, key=run, json=body)
            assert call('POST', '/tiny-moments', a, 201, key=run, json=body)['id'] == moment['id']
            call('POST', '/tiny-moments', a, 409, key=run, json={**body, 'content': 'Changed'})
            path = '/tiny-moments/' + moment['id']
            call('GET', path, c, 403)
            assert call('POST', path + '/read', b)['read_at']
            assert call('POST', path + '/reactions', b, json={'reaction': 'heart'})['reaction'] == 'heart'
            reply = call('POST', '/tiny-moments', b, 201, key=run+'reply', json={
                'moment_type': 'signal', 'content': 'thinking_of_you', 'reply_to': moment['id']})
            assert reply['reply_to'] == moment['id']
            report['checks'].append('text/signal/reply/read/reaction; stable retry and conflict; outsider denied')

            photo = io.BytesIO()
            Image.new('RGB', (2000, 1800), '#eaa090').save(photo, 'JPEG')
            # Real storage PUT, then discard only its acknowledgement. This is
            # fault injection, not replacement storage or fabricated records.
            from app.services.media_storage import MediaStorage
            import httpx
            original_upload=MediaStorage.upload
            with monkeypatch.context() as fault:
                def lose_ack(storage,path,content,mime_type='image/jpeg'):
                    original_upload(storage,path,content,mime_type)
                    raise httpx.ReadTimeout('Synthetic lost acknowledgement after real PUT')
                fault.setattr(MediaStorage,'upload',lose_ack)
                call('POST','/tiny-moments/media',a,503,key=run+'lost-ack',
                    data={'kind':'photo'},files={'file':('photo.jpg',photo.getvalue(),'image/jpeg')})
            recovered=call('POST','/tiny-moments/media',a,201,key=run+'lost-ack',
                data={'kind':'photo'},files={'file':('photo.jpg',photo.getvalue(),'image/jpeg')})
            call('DELETE','/tiny-moments/media/'+recovered['id'],a,204)
            report['checks'].append('real PUT with lost acknowledgement recovers same reservation/object; explicit cancellation succeeds')
            voice = io.BytesIO()
            with wave.open(voice, 'wb') as audio:
                audio.setnchannels(1)
                audio.setsampwidth(2)
                audio.setframerate(8000)
                audio.writeframes(b'\0\0' * 8000)
            for kind, content, mime in [('photo', photo.getvalue(), 'image/jpeg'), ('voice', voice.getvalue(), 'audio/wav')]:
                key = run + kind
                upload = call('POST', '/tiny-moments/media', a, 201, key=key,
                    data={'kind': kind}, files={'file': ('acceptance', content, mime)})
                assert call('POST', '/tiny-moments/media', a, 201, key=key,
                    data={'kind': kind}, files={'file': ('acceptance', content, mime)})['id'] == upload['id']
                call('POST', '/tiny-moments', c, 403, key=key, json={
                    'moment_type': kind, 'content': '', 'media_id': upload['id']})
                media_moment = call('POST', '/tiny-moments', a, 201, key=key, json={
                    'moment_type': kind, 'content': '', 'media_id': upload['id']})
                private = call('GET', '/tiny-moments/' + media_moment['id'], b)
                media_headers={'Authorization':'Bearer '+b['access_token']}
                downloaded=api.get(private['media_url'],headers=media_headers)
                assert downloaded.status_code==200
                assert downloaded.headers['cache-control']=='no-store, private'
                assert api.get(private['media_url']).status_code==401
                if kind=='photo':
                    assert max(Image.open(io.BytesIO(downloaded.content)).size)<=1600
                call('DELETE', '/tiny-moments/' + media_moment['id'], a, 204)
                assert api.get(private['media_url'],headers=media_headers).status_code==404
                report['checks'].append(kind + ': real private upload/read/idempotency; storage revoked after deletion')
            assert any(row['id'] == moment['id'] for row in call('GET', '/tiny-moments', b))
            call('DELETE', path, b, 403)
            call('DELETE', path, a, 204)
            call('DELETE', path, a, 204)
            call('GET', path, b, 404)
            assert call('GET','/tiny-moments?limit=1',b)[0]['id']==reply['id']
            report['checks'].append('sender-only deletion and retry; deleted content inaccessible')
            # Only age and clean the synthetic upload created by this run.
            # Production candidate selection/RPC/storage are used unchanged.
            abandoned=call('POST','/tiny-moments/media',a,201,key=run+'abandoned',
                data={'kind':'photo'},files={'file':('photo.jpg',photo.getvalue(),'image/jpeg')})
            from app.database import get_supabase
            from app.repositories.tiny_moment_repo import PrivateMediaRepository
            from app.services.tiny_moment_service import PrivateMomentService
            from app.services.moment_media_cleanup import cleanup_unclaimed_media
            db=get_supabase()
            aged=db.table('tiny_moment_media').update({'created_at':(datetime.now(timezone.utc)-timedelta(hours=25)).isoformat()}).eq('id',abandoned['id']).eq('owner_id',a['user']['id']).execute()
            assert len(aged.data)==1
            repository=PrivateMediaRepository(db)
            class OnlyThisRun:
                def cleanup_candidates(self,before,limit):
                    return [row for row in repository.cleanup_candidates(before,limit) if row['id']==abandoned['id']]
            assert cleanup_unclaimed_media(OnlyThisRun(),PrivateMomentService(db),limit=1000)=={'removed':1,'claimed':0,'failed':0}
            assert repository.get(abandoned['id']) is None
            call('POST','/tiny-moments',a,404,key=run+'expired',json={'moment_type':'photo','content':'','media_id':abandoned['id']})
            report['checks'].append('24h orphan cleanup uses real selection/RPC/storage; restricted to this run upload')
            dissolved = call('DELETE', '/couple', a, json={'couple_id': pair['id'], 'confirm': True})
            assert dissolved['status'] == 'dissolved' and dissolved['purge_after']
            call('GET', '/tiny-moments/' + reply['id'], b, 403)
            report['checks'].append('retention RPC dissolves synthetic pair; old membership immediately denied')
            report['complete'] = True
    finally:
        (output / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
