"""Real row-lock expiry checks in the isolated, opt-in flamee_ci database."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import secrets
import time
import os

import pytest

from tests.test_missions_sql import database  # Reuses the loopback-only isolated DB fixture.

pytestmark = [pytest.mark.sql_integration, pytest.mark.skipif(not os.getenv('FLAMEE_TEST_POSTGRES_DSN'), reason='Ephemeral PostgreSQL is opt-in')]


def function_definition(path):
    text = path.read_text(encoding='utf-8')
    start = text.index('CREATE OR REPLACE FUNCTION accept_couple_invite(')
    return text[start:text.index('\n$$;', start) + len('\n$$;')]


@pytest.mark.parametrize('source', ['schema.sql', 'migrations/20261114_invite_expiry_lock.sql'])
@pytest.mark.parametrize('blocked_row', ['invite', 'inviter', 'invitee'])
def test_accept_waiting_on_row_lock_past_expiry_is_rejected(database, blocked_row, source):
    import psycopg
    root = Path(__file__).resolve().parents[1]
    suffix = secrets.token_hex(8)
    inviter, invitee, invite = [suffix + part for part in ('a', 'b', 'i')]
    code = secrets.token_hex(3).upper()
    couple = suffix + 'couple'
    with psycopg.connect(database, autocommit=True) as admin:
        admin.execute(function_definition(root / source))
        for user in (inviter, invitee):
            admin.execute("INSERT INTO users(id,email,password_hash,full_name,created_at,updated_at) VALUES(%s,%s,'test','test',clock_timestamp()::text,clock_timestamp()::text)", (user, user + '@example.test'))
        admin.execute("INSERT INTO invite_codes(id,code,user_id,status,created_at,expires_at) VALUES(%s,%s,%s,'pending',clock_timestamp()::text,(clock_timestamp()+interval '3 seconds')::text)", (invite, code, inviter))
        supplied_now = admin.execute('SELECT clock_timestamp()::text').fetchone()[0]
        with psycopg.connect(database) as blocker, psycopg.connect(database, autocommit=True) as worker, ThreadPoolExecutor(max_workers=1) as pool:
            if blocked_row == 'invite':
                blocker.execute('SELECT id FROM invite_codes WHERE id=%s FOR UPDATE', (invite,))
            else:
                blocker.execute('SELECT id FROM users WHERE id=%s FOR UPDATE', (inviter if blocked_row == 'inviter' else invitee,))
            pid = worker.execute('SELECT pg_backend_pid()').fetchone()[0]
            future = pool.submit(lambda: worker.execute('SELECT accept_couple_invite(%s,%s,%s,%s)', (invitee, code, couple, supplied_now)).fetchone()[0])
            try:
                deadline = time.monotonic() + 8
                while not admin.execute('SELECT cardinality(pg_blocking_pids(%s)) > 0', (pid,)).fetchone()[0]:
                    assert not future.done(), 'acceptance completed without waiting on the held row'
                    assert time.monotonic() < deadline, 'acceptance never waited on the held row'
                    time.sleep(0.02)
                admin.execute("SELECT pg_sleep(GREATEST(0, extract(epoch FROM ((SELECT expires_at::timestamptz FROM invite_codes WHERE id=%s)-clock_timestamp())) + 0.1))", (invite,))
            finally:
                blocker.commit()
            assert future.result(timeout=8)['outcome'] == 'invite_expired'
        assert admin.execute('SELECT status,used_by FROM invite_codes WHERE id=%s', (invite,)).fetchone() == ('expired', None)
        assert admin.execute('SELECT count(*) FROM couples WHERE id=%s', (couple,)).fetchone()[0] == 0
        assert admin.execute('SELECT count(*) FROM users WHERE id IN (%s,%s) AND couple_id IS NOT NULL', (inviter, invitee)).fetchone()[0] == 0


@pytest.mark.parametrize('source', ['schema.sql', 'migrations/20261114_invite_expiry_lock.sql'])
def test_unexpired_invite_is_only_accepted_once_under_race(database, source):
    import psycopg
    root = Path(__file__).resolve().parents[1]
    suffix = secrets.token_hex(8)
    inviter, first, second = [suffix + part for part in ('a', 'b', 'c')]
    code = secrets.token_hex(3).upper()
    with psycopg.connect(database, autocommit=True) as admin:
        admin.execute(function_definition(root / source))
        for user in (inviter, first, second):
            admin.execute("INSERT INTO users(id,email,password_hash,full_name,created_at,updated_at) VALUES(%s,%s,'test','test',clock_timestamp()::text,clock_timestamp()::text)", (user, user + '@example.test'))
        admin.execute("INSERT INTO invite_codes(id,code,user_id,status,created_at,expires_at) VALUES(%s,%s,%s,'pending',clock_timestamp()::text,(clock_timestamp()+interval '1 minute')::text)", (suffix + 'i', code, inviter))
        def accept(user):
            with psycopg.connect(database, autocommit=True) as connection:
                return connection.execute('SELECT accept_couple_invite(%s,%s,%s,%s)', (user, code, suffix + user, '2000-01-01T00:00:00Z')).fetchone()[0]['outcome']
        with ThreadPoolExecutor(max_workers=2) as pool:
            outcomes = list(pool.map(accept, [first, second]))
        assert sorted(outcomes) == ['accepted', 'invite_used']
        assert admin.execute('SELECT count(*) FROM couples WHERE partner1_id=%s', (inviter,)).fetchone()[0] == 1


def test_schema_and_upgrade_migration_use_identical_invite_function():
    root = Path(__file__).resolve().parents[1]
    assert function_definition(root / 'schema.sql') == function_definition(root / 'migrations/20261114_invite_expiry_lock.sql')


@pytest.mark.parametrize('source', ['schema.sql', 'migrations/20261114_invite_expiry_lock.sql'])
def test_client_time_cannot_make_expired_invite_valid(database, source):
    import psycopg
    root = Path(__file__).resolve().parents[1]
    suffix = secrets.token_hex(8)
    inviter, invitee, invite = [suffix + part for part in ('a', 'b', 'i')]
    code = secrets.token_hex(3).upper()
    with psycopg.connect(database, autocommit=True) as connection:
        connection.execute(function_definition(root / source))
        for user in (inviter, invitee):
            connection.execute("INSERT INTO users(id,email,password_hash,full_name,created_at,updated_at) VALUES(%s,%s,'test','test',clock_timestamp()::text,clock_timestamp()::text)", (user, user + '@example.test'))
        connection.execute("INSERT INTO invite_codes(id,code,user_id,status,created_at,expires_at) VALUES(%s,%s,%s,'pending',clock_timestamp()::text,(clock_timestamp()-interval '1 second')::text)", (invite, code, inviter))
        result = connection.execute('SELECT accept_couple_invite(%s,%s,%s,%s)', (invitee, code, suffix + 'couple', '2000-01-01T00:00:00Z')).fetchone()[0]
        assert result['outcome'] == 'invite_expired'
        assert connection.execute('SELECT status FROM invite_codes WHERE id=%s', (invite,)).fetchone()[0] == 'expired'
