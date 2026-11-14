from datetime import datetime, timedelta, timezone

from app.core.exceptions import ForbiddenError


def cleanup_unclaimed_media(repository, service, *, now=None, limit=100):
    """Discard uploads abandoned for 24h, preserving concurrently sent media.

    The existing discard RPC locks and rechecks claimed_by before removal.
    Storage failures leave the discarded row available for the next run.
    No user content, object paths or identifiers are logged.
    """
    if not 1 <= limit <= 1000:
        raise ValueError('Cleanup batch must be between 1 and 1000')
    cutoff = ((now or datetime.now(timezone.utc)) - timedelta(hours=24)).isoformat()
    counts = {'removed': 0, 'claimed': 0, 'failed': 0}
    for row in repository.cleanup_candidates(cutoff, limit):
        try:
            service.discard_media(row['owner_id'], row['id'],finalize=True)
            counts['removed'] += 1
        except ForbiddenError:
            counts['claimed'] += 1
        except Exception:
            counts['failed'] += 1
    return counts
