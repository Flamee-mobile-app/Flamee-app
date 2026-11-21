from unittest.mock import Mock
import pytest
from app.repositories.conversation_repo import ConversationRepository
from app.core.exceptions import ForbiddenError, ConflictError, NotFoundError, ServiceUnavailableError


def test_comments_actor_comes_from_auth_and_payload_is_strict(client, alice_headers, monkeypatch):
    actor = client.get('/api/v1/auth/me', headers=alice_headers).json()['data']['id']
    call = Mock(return_value={'id': 'comment'})
    monkeypatch.setattr(ConversationRepository, 'execute', call)
    path = '/api/v1/memories/memory/comments'
    assert client.get(path).status_code == 401
    assert client.post(path, headers=alice_headers, json={'body': 'Hi'}).status_code == 422
    headers = {**alice_headers, 'Idempotency-Key': 'stable'}
    for body in [{'body': ' '}, {'body': 'a' * 1001}, {'body': 'Hi', 'author_id': 'other'}]:
        assert client.post(path, headers=headers, json=body).status_code == 422
    assert client.post(path, headers=headers, json={'body': ' Hi '}).status_code == 201
    call.assert_called_once_with(actor, 'create', 'memory', None, 'stable', {'body': 'Hi', 'parent_id': None})


def test_comment_versions_pagination_and_inbox_actor(client, alice_headers, monkeypatch):
    call = Mock(return_value={'items': [], 'unread_count': 0, 'total': 0})
    monkeypatch.setattr(ConversationRepository, 'execute', call)
    assert client.get('/api/v1/notifications?offset=-1', headers=alice_headers).status_code == 422
    assert client.get('/api/v1/memories/m/comments?limit=101', headers=alice_headers).status_code == 422
    assert client.put('/api/v1/memories/m/comments/c', headers=alice_headers, json={'body': 'Hi', 'version': True}).status_code == 422
    assert client.get('/api/v1/notifications', headers=alice_headers).status_code == 200
    assert call.call_args.args[1] == 'inbox'
    assert client.put('/api/v1/notifications/foreign/read', headers=alice_headers).status_code == 200
    assert call.call_args.args[1:4] == ('read', None, 'foreign')


@pytest.mark.parametrize('outcome,error', [('forbidden', ForbiddenError), ('conflict', ConflictError), ('not_found', NotFoundError), ('bad', ServiceUnavailableError)])
def test_rpc_outcomes_fail_closed(outcome, error):
    db = Mock()
    db.rpc.return_value.execute.return_value.data = {'outcome': outcome}
    with pytest.raises(error):
        ConversationRepository(db).execute('actor', 'create', 'memory')


def test_conversation_migration_is_atomic_and_included_in_bootstrap():
    from pathlib import Path
    root = Path(__file__).resolve().parents[1]
    migration = (root / 'migrations/20261115_memory_conversation.sql').read_text(encoding='utf-8')
    assert 'BEGIN;' in migration and migration.rstrip().endswith('COMMIT;')
    assert migration.strip() in (root / 'schema.sql').read_text(encoding='utf-8')
