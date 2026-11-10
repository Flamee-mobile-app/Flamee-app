from datetime import datetime,timezone


def expire_redemptions(repository,service,*,limit=100):
    if not 1<=limit<=1000:raise ValueError('Batch must be between 1 and 1000')
    counts={'expired':0,'skipped':0,'failed':0}
    for row in repository.expired(datetime.now(timezone.utc).isoformat(),limit):
        try:
            result=service.run(None,'expire',row['id'])
            counts['expired' if result['status']=='expired' else 'skipped']+=1
        except Exception:
            counts['failed']+=1
    return counts
