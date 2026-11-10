from datetime import datetime, timezone
from unittest.mock import Mock

from app.core.exceptions import ForbiddenError


def test_cleanup_keeps_claim_races_and_retries_storage_failures():
    from app.services.moment_media_cleanup import cleanup_unclaimed_media
    repo = Mock()
    repo.cleanup_candidates.return_value = [
        {'id': 'expired', 'owner_id': 'a'},
        {'id': 'claimed-during-scan', 'owner_id': 'b'},
        {'id': 'storage-failed', 'owner_id': 'c'},
    ]
    service = Mock()
    service.discard_media.side_effect = [None, ForbiddenError('Already claimed'), RuntimeError('Storage failed')]
    result = cleanup_unclaimed_media(repo, service, now=datetime(2026, 11, 10, tzinfo=timezone.utc))
    assert result == {'removed': 1, 'claimed': 1, 'failed': 1}
    repo.cleanup_candidates.assert_called_once_with('2026-11-09T00:00:00+00:00', 100)
    assert service.discard_media.call_args_list[1].args == ('b', 'claimed-during-scan')


def test_cleanup_rejects_unbounded_batches():
    from app.services.moment_media_cleanup import cleanup_unclaimed_media
    import pytest
    with pytest.raises(ValueError):
        cleanup_unclaimed_media(Mock(), Mock(), limit=1001)
