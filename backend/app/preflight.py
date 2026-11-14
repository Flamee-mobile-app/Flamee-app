"""Read-only schema/bucket deployment gate; never applies SQL or logs secrets."""
import json

import httpx

from app.config import settings

REQUIRED_COLUMNS={
    'users':{'couple_id','timezone'},'moods':{'draft_version'},'user_preferences':{'revision'},
    'tiny_moment_media':{'ready_at','discarded_at'},'mission_rules':{'version'},
    'mission_wallets':{'balance'},'mission_assignments':{'version'},'mission_ledger':{'delta'},
    'mission_rewards':{'stock'},'mission_redemptions':{'expires_at'},'mission_operators':{'active'},
}
REQUIRED_FUNCTIONS={'accept_couple_invite','rotate_auth_session','mutate_smart_nudge','create_smart_nudge_guarded',
    'mutate_tiny_moment','discard_tiny_moment_media','finalize_tiny_moment_media','dissolve_couple','mission_operation','reward_operation'}


def evaluate_schema(schema,bucket):
    definitions=schema.get('definitions',schema.get('components',{}).get('schemas',{}))
    missing=[table+'.'+column for table,columns in REQUIRED_COLUMNS.items() for column in columns
        if column not in definitions.get(table,{}).get('properties',{})]
    missing+=['rpc.'+name for name in REQUIRED_FUNCTIONS if '/rpc/'+name not in schema.get('paths',{})]
    private=bucket.get('id')=='flamee-media' and bucket.get('public') is False
    return {'ready':not missing and private,'missing':sorted(missing),'private_media_bucket':private}


def check():
    settings.assert_production_safe()
    if not settings.supabase_url or not settings.supabase_service_key:
        return {'ready':False,'reason':'database_configuration_missing'}
    headers={'apikey':settings.supabase_service_key,'Authorization':'Bearer '+settings.supabase_service_key}
    try:
        with httpx.Client(timeout=15) as client:
            schema=client.get(settings.supabase_url.rstrip('/')+'/rest/v1/',headers=headers)
            bucket=client.get(settings.supabase_url.rstrip('/')+'/storage/v1/bucket/flamee-media',headers=headers)
            if schema.status_code!=200 or bucket.status_code!=200:
                return {'ready':False,'reason':'database_or_storage_access_failed'}
            return evaluate_schema(schema.json(),bucket.json())
    except (httpx.HTTPError,ValueError):
        return {'ready':False,'reason':'database_or_storage_unavailable'}


def main():
    try:result=check()
    except ValueError:result={'ready':False,'reason':'unsafe_production_configuration'}
    print(json.dumps(result))
    return int(not result['ready'])


if __name__=='__main__':raise SystemExit(main())
