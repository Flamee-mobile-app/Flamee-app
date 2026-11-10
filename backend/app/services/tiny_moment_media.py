import io
import hashlib
import json
import math
import shutil
import subprocess
import tempfile
import wave
from pathlib import Path
from uuid import uuid5,NAMESPACE_URL
from postgrest.exceptions import APIError
from storage3.exceptions import StorageApiError

from app.core.exceptions import ConflictError, FeatureUnavailableError, ValidationError
from app.services.media_processing import process_memory_image
from app.services.media_storage import MediaStorage
from app.repositories.tiny_moment_repo import PrivateMediaRepository

MAX_BYTES = 2 * 1024 * 1024


def voice_metadata(content):
    # WAV can be inspected using the standard library without an external tool.
    if content.startswith(b'RIFF') and content[8:12] == b'WAVE':
        try:
            with wave.open(io.BytesIO(content)) as audio:
                duration = audio.getnframes() / audio.getframerate()
                if not 0 < duration <= 30 or audio.getnchannels() not in (1, 2):
                    raise ValidationError('Voice must be at most 30 seconds')
                if len(audio.readframes(audio.getnframes())) != audio.getnframes()*audio.getsampwidth()*audio.getnchannels():
                    raise ValidationError('Truncated voice file')
                return duration, 'audio/wav'
        except (wave.Error, ZeroDivisionError, EOFError):
            raise ValidationError('Invalid voice file') from None
    probe = shutil.which('ffprobe')
    if not (content[4:8]==b'ftyp' or content.startswith(b'OggS') or content.startswith(b'\x1aE\xdf\xa3')):
        raise ValidationError('Unsupported voice container')
    if not probe:
        raise FeatureUnavailableError('Voice validation requires ffprobe on the server')
    with tempfile.TemporaryDirectory(prefix='flamee-voice-') as directory:
        path = Path(directory) / 'upload'
        path.write_bytes(content)
        try:
            process = subprocess.run([probe, '-protocol_whitelist', 'file,pipe', '-v', 'error', '-show_entries',
                'stream=codec_type:format=duration,format_name', '-of', 'json', str(path)],
                capture_output=True, timeout=8, check=True,
                **({'creationflags': subprocess.CREATE_NO_WINDOW} if __import__('os').name == 'nt' else {}))
            info = json.loads(process.stdout)
            streams = info.get('streams', [])
            duration = float(info['format']['duration'])
            formats = info['format']['format_name'].split(',')
            if not streams or any(stream.get('codec_type') != 'audio' for stream in streams) or not math.isfinite(duration) or not 0 < duration <= 30:
                raise ValueError('Invalid audio duration/streams')
            if 'mov' in formats or 'mp4' in formats:
                mime = 'audio/mp4'
            elif 'ogg' in formats:
                mime = 'audio/ogg'
            elif 'matroska' in formats or 'webm' in formats:
                mime = 'audio/webm'
            else:
                raise ValueError('Unsupported voice container')
            return duration, mime
        except (subprocess.SubprocessError, ValueError, KeyError, TypeError):
            raise ValidationError('Invalid voice file or voice longer than 30 seconds') from None


def upload_moment_media(db, user_id, pair, kind, stream, request_key):
    content = stream.read(MAX_BYTES + 1)
    if not content or len(content) > MAX_BYTES:
        raise ValidationError('Media must be between 1 byte and 2MB')
    fingerprint=hashlib.sha256(content).hexdigest()
    repository=PrivateMediaRepository(db)
    media_id=str(uuid5(NAMESPACE_URL,f'flamee-tiny-media:{user_id}:{pair}:{request_key}'))
    def confirmed(row):
        if row['owner_id']!=user_id or row['couple_id']!=pair or row['kind']!=kind or row.get('fingerprint')!=fingerprint or row.get('discarded_at'):
            raise ConflictError('Media request changed')
        return {field:row.get(field) for field in ['id','kind','size_bytes','duration_seconds']}
    existing=repository.get(media_id)
    if existing:
        confirmed(existing)
        if existing.get('ready_at'):return confirmed(existing)
    duration = None
    if kind == 'photo':
        prepared = process_memory_image(io.BytesIO(content), max_bytes=MAX_BYTES).original
        content, mime = prepared.content, prepared.mime_type
        if len(content) > MAX_BYTES:
            raise ValidationError('Encoded image exceeds 2MB')
    else:
        duration, mime = voice_metadata(content)
    # Reserve before PUT: a lost storage acknowledgement still leaves a durable
    # owner/path record for retries and cleanup. One key always uses one path.
    if not existing:
        try:
            existing=repository.create({'id':media_id, 'owner_id':user_id,
                'couple_id':pair, 'kind':kind, 'storage_path':f'tiny-moments/{pair}/{user_id}/{media_id}',
                'mime_type':mime, 'size_bytes':len(content), 'duration_seconds':duration,
                'claimed_by':None, 'fingerprint':fingerprint, 'ready_at':None})
        except APIError as error:
            if error.code!='23505':raise
            existing=repository.get(media_id)
            if not existing:raise
        confirmed(existing)
        if existing.get('ready_at'):return confirmed(existing)
    path=existing['storage_path']
    storage=MediaStorage(db)
    try:
        storage.upload(path,content,mime)
    except StorageApiError as error:
        if str(error.status)!='409' and error.code not in ('Duplicate','ResourceAlreadyExists'):
            raise
        # Recover only the exact bytes belonging to this reserved request.
        if storage.download(path)!=content:
            raise ConflictError('Stored media differs from the upload request') from None
    return confirmed(repository.finalize(media_id,user_id))
