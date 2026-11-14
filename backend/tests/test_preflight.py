from app.preflight import REQUIRED_COLUMNS,REQUIRED_FUNCTIONS,evaluate_schema


def test_preflight_rejects_missing_migration_or_public_storage():
    schema={'definitions':{name:{'properties':{column:{} for column in columns}} for name,columns in REQUIRED_COLUMNS.items()},
        'paths':{'/rpc/'+name:{} for name in REQUIRED_FUNCTIONS}}
    bucket={'id':'flamee-media','public':False}
    assert evaluate_schema(schema,bucket)['ready']
    schema['definitions']['tiny_moment_media']['properties'].pop('ready_at')
    assert 'tiny_moment_media.ready_at' in evaluate_schema(schema,bucket)['missing']
    schema['definitions']['tiny_moment_media']['properties']['ready_at']={}
    bucket['public']=True
    assert not evaluate_schema(schema,bucket)['ready']
