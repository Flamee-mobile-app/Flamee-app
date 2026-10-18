from unittest.mock import MagicMock

import pytest

from app.core.exceptions import FeatureUnavailableError, ValidationError
from app.services.memory_service import MemoryService
from app.services.subscription_service import SubscriptionService


def test_plans_do_not_mask_database_failure():
    db = MagicMock()
    db.table.side_effect = RuntimeError('database unavailable')
    with pytest.raises(RuntimeError, match='database unavailable'):
        SubscriptionService(db).list_active_plans()


def test_empty_plans_remain_empty(fake_db):
    assert SubscriptionService(fake_db).list_active_plans() == []


def test_checkout_and_manual_activation_do_not_write():
    db = MagicMock()
    service = SubscriptionService(db)
    with pytest.raises(FeatureUnavailableError):
        service.create_checkout_order('couple', 'user', 'plan')
    with pytest.raises(FeatureUnavailableError):
        service.activate_order('order', expected_user_id='user')
    db.table.assert_not_called()


def test_invalid_private_upload_does_not_write_storage():
    import io
    from fastapi import UploadFile
    db, memories, images = MagicMock(), MagicMock(), MagicMock()
    memories.get.return_value.couple_id = 'couple'
    service = MemoryService(db, memories, images)
    with pytest.raises(ValidationError):
        service.upload_image('user', 'couple', 'memory', UploadFile(file=io.BytesIO(b'not an image')))
    db.storage.from_.return_value.upload.assert_not_called()
    images.create.assert_not_called()
