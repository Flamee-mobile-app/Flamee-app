import io
import wave
import pytest
from PIL import Image
from tests.test_smart_nudge_state import _pair


def test_photo_upload_is_real_private_and_owned(client, alice_headers, bob_headers, fake_db):
    _pair(client, alice_headers, bob_headers)
    image = io.BytesIO()
    Image.new('RGB', (2000, 1800), 'red').save(image, format='PNG')
    response = client.post('/api/v1/tiny-moments/media', headers={**alice_headers,'Idempotency-Key':'upload-photo'},
        data={'kind':'photo'}, files={'file':('photo.png',image.getvalue(),'image/png')})
    assert response.status_code == 201
    media = response.json()['data']
    replay=client.post('/api/v1/tiny-moments/media',headers={**alice_headers,'Idempotency-Key':'upload-photo'},
        data={'kind':'photo'},files={'file':('photo.png',image.getvalue(),'image/png')})
    assert replay.status_code==201 and replay.json()['data']['id']==media['id']
    assert len(fake_db.storage.buckets['flamee-media'].objects)==1
    assert media['kind']=='photo' and 'storage_path' not in media and 'url' not in media
    forged = client.post('/api/v1/tiny-moments', headers={**bob_headers,'Idempotency-Key':'foreign-media'},
        json={'moment_type':'photo','content':'Caption','media_id':media['id']})
    assert forged.status_code == 404
    saved = client.post('/api/v1/tiny-moments', headers={**alice_headers,'Idempotency-Key':'photo-media'},
        json={'moment_type':'photo','content':'Caption','media_id':media['id']})
    assert saved.status_code==201
    media_url=saved.json()['data']['media_url']
    assert media_url=='/api/v1/tiny-moments/'+saved.json()['data']['id']+'/media'
    assert client.get(media_url).status_code==401
    assert client.get(media_url,headers=bob_headers).status_code==200
    assert len(fake_db.storage.buckets['flamee-media'].objects)==1
    assert client.delete('/api/v1/tiny-moments/'+saved.json()['data']['id'],headers=alice_headers).status_code==204
    assert client.get(media_url,headers=bob_headers).status_code==404
    assert not fake_db.storage.buckets['flamee-media'].objects


def test_media_rejects_non_photo_and_oversized_voice(client, alice_headers, bob_headers):
    _pair(client,alice_headers,bob_headers)
    for kind, content in [('photo',b'not an image'),('voice',b'x'*(2*1024*1024+1))]:
        response=client.post('/api/v1/tiny-moments/media',headers={**alice_headers,'Idempotency-Key':'upload-'+kind},
            data={'kind':kind},files={'file':('file.bin',content,'application/octet-stream')})
        assert response.status_code==400


def wav(seconds):
    output=io.BytesIO()
    with wave.open(output,'wb') as audio:
        audio.setnchannels(1);audio.setsampwidth(2);audio.setframerate(8000)
        audio.writeframes(b'\0\0'*int(8000*seconds))
    return output.getvalue()


def test_voice_duration_is_measured_from_bytes_and_truncated_audio_rejected():
    from app.services.tiny_moment_media import voice_metadata
    from app.core.exceptions import ValidationError
    assert voice_metadata(wav(1))[0]==1
    with pytest.raises(ValidationError):voice_metadata(wav(31))
    with pytest.raises(ValidationError):voice_metadata(wav(1)[:-100])


def test_unclaimed_media_can_be_discarded_only_by_owner(client,alice_headers,bob_headers,fake_db):
    _pair(client,alice_headers,bob_headers)
    content=io.BytesIO();Image.new('RGB',(10,10),'blue').save(content,format='PNG')
    uploaded=client.post('/api/v1/tiny-moments/media',headers={**alice_headers,'Idempotency-Key':'cancel-upload'},
        data={'kind':'photo'},files={'file':('photo.png',content.getvalue(),'image/png')}).json()['data']
    path='/api/v1/tiny-moments/media/'+uploaded['id']
    assert client.delete(path,headers=bob_headers).status_code==403
    assert client.delete(path,headers=alice_headers).status_code==204
    assert client.delete(path,headers=alice_headers).status_code==204
    assert not fake_db.storage.buckets['flamee-media'].objects


def test_storage_commit_without_ack_is_tracked_and_recovered(client,alice_headers,bob_headers,fake_db,monkeypatch):
    import httpx
    from storage3.exceptions import StorageApiError
    _pair(client,alice_headers,bob_headers)
    content=io.BytesIO();Image.new('RGB',(20,20),'green').save(content,format='PNG')
    bucket=fake_db.storage.from_('flamee-media')
    original=bucket.upload
    first=True
    def uncertain_upload(path,file,file_options=None):
        nonlocal first
        if first:
            first=False
            original(path,file,file_options)
            raise httpx.ReadTimeout('Upload acknowledgement lost')
        raise StorageApiError('Already exists','Duplicate',409)
    monkeypatch.setattr(bucket,'upload',uncertain_upload)
    def upload():
        return client.post('/api/v1/tiny-moments/media',headers={**alice_headers,'Idempotency-Key':'uncertain-upload'},
            data={'kind':'photo'},files={'file':('photo.png',content.getvalue(),'image/png')})
    assert upload().status_code==503
    rows=list(fake_db.table('tiny_moment_media')._data.values())
    assert len(rows)==1 and rows[0]['ready_at'] is None
    media_id=rows[0]['id']
    assert client.post('/api/v1/tiny-moments',headers={**alice_headers,'Idempotency-Key':'not-ready'},
        json={'moment_type':'photo','content':'','media_id':media_id}).status_code==404
    recovered=upload()
    assert recovered.status_code==201 and recovered.json()['data']['id']==media_id
    assert len(bucket.objects)==1 and fake_db.table('tiny_moment_media')._data[media_id]['ready_at']
