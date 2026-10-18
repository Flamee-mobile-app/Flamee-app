from __future__ import annotations

import pytest
from starlette.testclient import TestClient


def _create_paired_couple(client: TestClient) -> tuple[str, str, str]:
    """Helper tạo 2 user và ghép đôi thành công, trả về (token_alice, token_bob, couple_id)."""
    # 1. Register Alice
    r_alice = client.post(
        "/api/v1/auth/register",
        json={"email": "alice_test@example.com", "password": "password123", "full_name": "Alice"},
    )
    assert r_alice.status_code == 201
    token_alice = r_alice.json()["data"]["access_token"]
    headers_alice = {"Authorization": f"Bearer {token_alice}"}

    # 2. Register Bob
    r_bob = client.post(
        "/api/v1/auth/register",
        json={"email": "bob_test@example.com", "password": "password123", "full_name": "Bob"},
    )
    assert r_bob.status_code == 201
    token_bob = r_bob.json()["data"]["access_token"]
    headers_bob = {"Authorization": f"Bearer {token_bob}"}

    # 3. Alice creates invite
    r_inv = client.post("/api/v1/couple/invite-code", headers=headers_alice)
    assert r_inv.status_code == 201
    invite_code = r_inv.json()["data"]["code"]

    # 4. Bob accepts invite
    r_acc = client.post(
        "/api/v1/couple/accept-invite",
        headers=headers_bob,
        json={"code": invite_code},
    )
    assert r_acc.status_code == 200
    couple_id = r_acc.json()["data"]["id"]

    return token_alice, token_bob, couple_id


def test_google_login_does_not_accept_mock_identity(client, fake_db):
    response = client.post('/api/v1/auth/google', json={'id_token': 'mock-token', 'email': 'test@example.com'})
    assert response.status_code == 404
    assert fake_db.table('users')._data == {}


def test_mood_checkin_creates_smart_nudge(client: TestClient):
    """Kiểm tra check-in mood tự động kích hoạt tạo Smart Nudge cho đối phương."""
    token_alice, token_bob, couple_id = _create_paired_couple(client)
    headers_alice = {"Authorization": f"Bearer {token_alice}"}
    headers_bob = {"Authorization": f"Bearer {token_bob}"}

    # Alice check in mood mệt mỏi vì công việc
    r_mood = client.post(
        "/api/v1/moods",
        headers=headers_alice,
        json={
            "mood": "tired",
            "intensity": 4,
            "note": "Hôm nay chạy deadline mệt quá",
            "is_private": False,
            "mood_score": 2,
            "reasons": ["work"],
            "share_level": "all",
        },
    )
    assert r_mood.status_code == 201

    # Bob kiểm tra xem có Nudge được tạo cho mình không
    r_nudge = client.get("/api/v1/nudges/active", headers=headers_bob)
    assert r_nudge.status_code == 200
    nudge_data = r_nudge.json()["data"]
    assert nudge_data is not None
    assert nudge_data["status"] == "new"
    assert len(nudge_data["draft"]) > 0
    assert len(nudge_data["observation"]) > 0


def test_private_checkin_does_not_create_nudge(client: TestClient):
    """Kiểm tra share_level='private' tuyệt đối không tạo Nudge cho đối phương."""
    token_alice, token_bob, couple_id = _create_paired_couple(client)
    headers_alice = {"Authorization": f"Bearer {token_alice}"}
    headers_bob = {"Authorization": f"Bearer {token_bob}"}

    # Alice check in ở chế độ riêng tư
    r_mood = client.post(
        "/api/v1/moods",
        headers=headers_alice,
        json={
            "mood": "sad",
            "intensity": 2,
            "note": "Nhật ký riêng tư bí mật",
            "is_private": True,
            "mood_score": 1,
            "reasons": ["pressure"],
            "share_level": "private",
        },
    )
    assert r_mood.status_code == 201

    # Bob không thấy Nudge nào
    r_nudge = client.get("/api/v1/nudges/active", headers=headers_bob)
    assert r_nudge.status_code == 200
    assert r_nudge.json()["data"] is None


def test_nudge_actions_and_rating(client: TestClient):
    """Kiểm tra các hành động phản hồi Nudge (snooze, completed, rate)."""
    token_alice, token_bob, couple_id = _create_paired_couple(client)
    headers_alice = {"Authorization": f"Bearer {token_alice}"}
    headers_bob = {"Authorization": f"Bearer {token_bob}"}

    # Alice check in tạo nudge
    client.post(
        "/api/v1/moods",
        headers=headers_alice,
        json={"mood_score": 2, "reasons": ["work"], "share_level": "all"},
    )

    r_nudge = client.get("/api/v1/nudges/active", headers=headers_bob)
    nudge_id = r_nudge.json()["data"]["id"]

    # Bob dời nhắc nhở sau 2 tiếng (snooze)
    r_snooze = client.post(
        f"/api/v1/nudges/{nudge_id}/action",
        headers=headers_bob,
        json={"action": "snoozed"},
    )
    assert r_snooze.status_code == 200

    # Sau khi snooze, active nudge sẽ ẩn
    r_active_after_snooze = client.get("/api/v1/nudges/active", headers=headers_bob)
    assert r_active_after_snooze.json()["data"] is None

    # Bob đánh giá Nudge 5 sao (thumbs_up)
    r_rate = client.post(
        f"/api/v1/nudges/{nudge_id}/rate",
        headers=headers_bob,
        json={"rating": "thumbs_up", "feedback_reason": "Gợi ý rất chuẩn xác"},
    )
    assert r_rate.status_code == 200
    assert r_rate.json()["data"]["rated"] is True


def test_tiny_moments(client: TestClient):
    """Kiểm tra gửi và lấy danh sách tương tác vi mô Tiny Moments."""
    token_alice, token_bob, couple_id = _create_paired_couple(client)
    headers_alice = {"Authorization": f"Bearer {token_alice}"}

    # Alice gửi một cái ôm cho Bob
    r_moment = client.post(
        "/api/v1/tiny-moments",
        headers=headers_alice,
        json={
            "couple_id": couple_id,
            "sender_id": "dummy",
            "moment_type": "signal",
            "content": "Cái ôm ấm áp 🤗",
        },
    )
    assert r_moment.status_code == 201
    assert r_moment.json()["data"]["content"] == "Cái ôm ấm áp 🤗"

    # Lấy danh sách moments
    r_list = client.get("/api/v1/tiny-moments", headers=headers_alice)
    assert r_list.status_code == 200
    assert len(r_list.json()["data"]) >= 1


def test_subscription_uses_persisted_plans_and_does_not_fake_checkout(client, fake_db):
    alice, bob, couple_id = _create_paired_couple(client)
    headers = {'Authorization': 'Bearer ' + alice}
    assert client.get('/api/v1/subscriptions/plans').json()['data'] == []
    plan = {'id': 'test-plan', 'code': 'test', 'is_active': True, 'price': 100}
    fake_db.table('subscription_plans').insert(plan).execute()
    assert client.get('/api/v1/subscriptions/plans').json()['data'] == [plan]
    response = client.post('/api/v1/subscriptions/checkout', headers=headers, json={'plan_id': 'test-plan'})
    assert response.status_code == 501
    assert fake_db.table('payment_orders')._data == {}
    assert fake_db.table('couples')._data[couple_id].get('subscription_tier', 'free') == 'free'
