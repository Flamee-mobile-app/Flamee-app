"""Durable database-driven cleanup; no client data or credentials in logs."""
import argparse
import json
import signal
import threading
import time

from app.config import settings
from app.database import get_supabase,reset_supabase
from app.repositories.reward_repo import RewardRepository
from app.repositories.tiny_moment_repo import PrivateMediaRepository
from app.services.moment_media_cleanup import cleanup_unclaimed_media
from app.services.redemption_cleanup import expire_redemptions
from app.services.reward_service import RewardService
from app.services.tiny_moment_service import PrivateMomentService


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--interval',type=int,default=60)
    parser.add_argument('--once',action='store_true')
    args=parser.parse_args()
    if not 10<=args.interval<=3600:parser.error('Interval must be 10..3600 seconds')
    settings.assert_production_safe()
    stop=threading.Event()
    signal.signal(signal.SIGTERM,lambda *_:stop.set())
    signal.signal(signal.SIGINT,lambda *_:stop.set())
    last_media=None
    failures=0
    try:
        while not stop.is_set():
            try:
                db=get_supabase()
                rewards=RewardRepository(db)
                result={'redemptions':expire_redemptions(rewards,RewardService(rewards))}
                if last_media is None or time.monotonic()-last_media>=3600:
                    result['media']=cleanup_unclaimed_media(PrivateMediaRepository(db),PrivateMomentService(db))
                    last_media=time.monotonic()
                failures=sum(value['failed'] for value in result.values())
                print(json.dumps({'event':'maintenance.completed','counts':result}),flush=True)
            except Exception:
                failures=1
                print(json.dumps({'event':'maintenance.failed'}),flush=True)
            if args.once:break
            stop.wait(args.interval)
    finally:reset_supabase()
    return int(failures>0)


if __name__=='__main__':raise SystemExit(main())
