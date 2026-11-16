from unittest.mock import MagicMock

from app.repositories.mood_reminder_repo import MoodReminderRepository


def test_reminders_use_bearer_actor_validate_timezone_and_support_unpaired(client, alice_headers, monkeypatch):
    actor = client.get('/api/v1/auth/me', headers=alice_headers).json()['data']['id']
    call = MagicMock(return_value={'show_prompt': False, 'reminder': None})
    monkeypatch.setattr(MoodReminderRepository, 'execute', call)
    path = '/api/v1/moods/reminders/ensure'
    assert client.post(path, json={'timezone': 'UTC'}).status_code == 401
    assert client.post(path, headers=alice_headers, json={'timezone': 'invalid'}).status_code == 422
    assert client.post(path, headers=alice_headers, json={'timezone': 'UTC', 'user_id': 'other'}).status_code == 422
    assert client.post(path, headers=alice_headers, json={'timezone': 'Asia/Ho_Chi_Minh'}).status_code == 200
    call.assert_called_once_with(actor, 'ensure', 'Asia/Ho_Chi_Minh')
    call.return_value = {'items': [], 'total': 0, 'unread_count': 0}
    assert client.get('/api/v1/moods/reminders?offset=20', headers=alice_headers).status_code == 200
    call.assert_called_with(actor, 'list', limit=20, offset=20)
    assert client.put('/api/v1/moods/reminders/notification/read', headers=alice_headers).status_code == 200
    call.assert_called_with(actor, 'read', target='notification')
