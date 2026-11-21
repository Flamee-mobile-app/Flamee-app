from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from app.repositories.memory_heart_repo import MemoryHeartRepository
from app.core.exceptions import ForbiddenError, NotFoundError, ServiceUnavailableError


def test_post_heart_uses_server_actor_and_validates_acknowledgement():
    db = MagicMock()
    db.rpc.return_value.execute.return_value = SimpleNamespace(data={
        "outcome": "ok", "data": {"memory_id": "post", "heart_count": 1, "hearted": True},
    })
    assert MemoryHeartRepository(db).execute("actor", "post", True)["hearted"] is True
    db.rpc.assert_called_once_with("memory_post_heart_operation", {"p_user": "actor", "p_memory": "post", "p_desired": True})


@pytest.mark.parametrize("outcome,exception", [("forbidden", ForbiddenError), ("not_found", NotFoundError), ("unknown", ServiceUnavailableError)])
def test_post_heart_denial_is_never_empty_success(outcome, exception):
    db = MagicMock()
    db.rpc.return_value.execute.return_value = SimpleNamespace(data={"outcome": outcome})
    with pytest.raises(exception):
        MemoryHeartRepository(db).execute("actor", "post")


def test_missing_rpc_and_wrong_post_remain_unavailable():
    db = MagicMock()
    db.rpc.return_value.execute.side_effect = RuntimeError("Missing migration")
    with pytest.raises(ServiceUnavailableError):
        MemoryHeartRepository(db).execute("actor", "post")
    db.rpc.return_value.execute.side_effect = None
    db.rpc.return_value.execute.return_value = SimpleNamespace(data={"outcome": "ok", "data": {"memory_id": "other", "heart_count": 0, "hearted": False}})
    with pytest.raises(ServiceUnavailableError):
        MemoryHeartRepository(db).execute("actor", "post")


def test_post_heart_routes_take_actor_from_bearer_and_keep_delete_ack_json(client, alice_headers, monkeypatch):
    actor = client.get("/api/v1/auth/me", headers=alice_headers).json()["data"]["id"]
    call = MagicMock(return_value={"memory_id": "post", "heart_count": 1, "hearted": True})
    monkeypatch.setattr(MemoryHeartRepository, "execute", call)
    path = "/api/v1/memories/post/heart"
    assert client.get(path).status_code == 401
    assert client.get(path, headers=alice_headers).status_code == 200
    call.assert_called_with(actor, "post")
    assert client.put(path, headers=alice_headers).status_code == 200
    call.assert_called_with(actor, "post", True)
    response = client.delete(path, headers=alice_headers)
    assert response.status_code == 200
    assert response.json()["data"]["memory_id"] == "post"
    call.assert_called_with(actor, "post", False)
