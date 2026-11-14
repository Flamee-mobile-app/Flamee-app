import asyncio
import json

import pytest
from starlette.websockets import WebSocketDisconnect

from app.services.websocket_service import ConnectionManager


class Socket:
    def __init__(self):
        self.messages = []
        self.closed = False

    async def accept(self):
        pass

    async def close(self, code):
        self.closed = True

    async def send_text(self, text):
        self.messages.append(json.loads(text))


def test_revoked_socket_cannot_receive_and_events_are_minimal():
    async def scenario():
        manager = ConnectionManager()
        socket = Socket()
        active = True
        async def validate():
            return active
        await manager.connect(socket, 'owner', 'couple', validate=validate)
        await manager.send_to_user('owner', 'nudge.new', {'id': 'n-1', 'version': 2, 'note': 'PRIVATE', 'draft': 'PRIVATE'})
        assert socket.messages == [{'event': 'nudge.new', 'data': {'id': 'n-1', 'version': 2}}]
        active = False
        await manager.send_to_user('owner', 'nudge.new', {'id': 'n-2'})
        assert len(socket.messages) == 1 and socket.closed
    asyncio.run(scenario())


def test_broadcast_is_bound_to_socket_couple_instead_of_only_user():
    async def scenario():
        manager = ConnectionManager()
        old, new = Socket(), Socket()
        async def validate():
            return True
        await manager.connect(old, 'owner', 'old', validate=validate)
        await manager.connect(new, 'owner', 'new', validate=validate)
        await manager.broadcast_to_couple('old', 'memory.updated', {'id': 'm'})
        assert len(old.messages) == 1 and not new.messages
        await manager.send_to_user('owner', 'nudge.new', {'id': 'old-nudge'}, couple_id='old')
        assert len(old.messages) == 2 and not new.messages
        manager.disconnect(old, 'owner', 'old')
        await manager.broadcast_to_couple('old', 'memory.updated', {'id': 'm2'})
        assert len(new.messages) == 0
    asyncio.run(scenario())


def test_socket_rechecks_session_before_pong(client, alice_headers):
    token = alice_headers['Authorization'].split(' ', 1)[1]
    with client.websocket_connect('/api/v1/ws') as ws:
        ws.send_json({'type': 'auth', 'access_token': token})
        assert ws.receive_json() == {'event': 'ready', 'data': {}}
        assert client.post('/api/v1/auth/logout', headers=alice_headers).status_code == 200
        ws.send_text('ping')
        with pytest.raises(WebSocketDisconnect):
            ws.receive_text()


@pytest.mark.parametrize('change', ['unpair', 'expiry'])
def test_socket_rechecks_membership_and_expiry(client, alice_headers, bob_headers, fake_db, change):
    from tests.test_smart_nudge_state import _pair
    from datetime import datetime, timedelta, timezone
    _pair(client, alice_headers, bob_headers)
    token = alice_headers['Authorization'].split(' ', 1)[1]
    owner = client.get('/api/v1/auth/me', headers=alice_headers).json()['data']['id']
    with client.websocket_connect('/api/v1/ws') as ws:
        ws.send_json({'type': 'auth', 'access_token': token})
        assert ws.receive_json()['event'] == 'ready'
        if change == 'unpair':
            fake_db.table('users')._data[owner]['couple_id'] = None
        else:
            for row in fake_db.table('auth_sessions')._data.values():
                if row['user_id'] == owner:
                    row['expires_at'] = (datetime.now(timezone.utc) - timedelta(seconds=1)).isoformat()
        ws.send_text('ping')
        with pytest.raises(WebSocketDisconnect):
            ws.receive_text()


def test_memory_and_shared_mood_publish_only_invalidation(client, alice_headers, bob_headers, monkeypatch):
    from app.services.websocket_service import ws_manager
    from tests.test_smart_nudge_state import _pair
    _pair(client, alice_headers, bob_headers)
    sent = []
    monkeypatch.setattr(ws_manager, 'sync_broadcast_to_couple', lambda pair, event, data, **kwargs: sent.append((event, data)))
    memory = client.post('/api/v1/memories', headers=alice_headers, json={'title': 'Private title', 'memory_date': '2026-11-10', 'category': 'other'})
    assert memory.status_code == 201
    assert ('memory.created', {'id': memory.json()['data']['id']}) in sent
    sent.clear()
    mood = client.post('/api/v1/moods', headers=alice_headers, json={'mood_score': 3, 'share_level': 'private', 'note': 'PRIVATE'})
    assert mood.status_code == 201 and sent == []
    mood = client.post('/api/v1/moods', headers=alice_headers, json={'mood_score': 3, 'share_level': 'all', 'note': 'PRIVATE'})
    assert mood.status_code == 201
    assert ('mood.updated', {'id': mood.json()['data']['id']}) in sent
