"""One bounded cleanup batch; schedule on the server, never in a client app."""
import argparse
import json

from app.database import get_supabase, reset_supabase
from app.repositories.tiny_moment_repo import PrivateMediaRepository
from app.services.moment_media_cleanup import cleanup_unclaimed_media
from app.services.tiny_moment_service import PrivateMomentService


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--limit', type=int, default=100, choices=range(1, 1001), metavar='1..1000')
    args = parser.parse_args()
    try:
        db = get_supabase()
        result = cleanup_unclaimed_media(PrivateMediaRepository(db), PrivateMomentService(db), limit=args.limit)
        print(json.dumps(result))
        return int(result['failed'] > 0)
    finally:
        reset_supabase()


if __name__ == '__main__':
    raise SystemExit(main())
