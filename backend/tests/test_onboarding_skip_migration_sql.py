"""Run the additive migration against a fresh loopback-only CI database."""
import os
from pathlib import Path
import secrets
from urllib.parse import urlsplit

import pytest

pytestmark = [pytest.mark.sql_integration, pytest.mark.skipif(not os.getenv('FLAMEE_TEST_POSTGRES_DSN'), reason='Ephemeral PostgreSQL is opt-in')]


def test_additive_skip_migration_preserves_existing_rows_and_is_repeatable():
    import psycopg
    from psycopg import sql
    from psycopg.conninfo import make_conninfo

    dsn = os.environ['FLAMEE_TEST_POSTGRES_DSN']
    parsed = urlsplit(dsn)
    assert parsed.hostname in ('127.0.0.1', 'localhost') and parsed.path.startswith('/flamee_ci'), 'Isolated CI database only'
    database = 'flamee_ci_onboarding_' + secrets.token_hex(6)
    with psycopg.connect(dsn, autocommit=True) as admin:
        admin.execute(sql.SQL('CREATE DATABASE {}').format(sql.Identifier(database)))
    isolated_dsn = make_conninfo(dsn, dbname=database)
    migration = (Path(__file__).resolve().parents[1] / 'migrations/20261114_onboarding_skip.sql').read_text(encoding='utf-8')
    with psycopg.connect(isolated_dsn, autocommit=True) as connection:
        connection.execute('CREATE TABLE public.user_preferences (id text PRIMARY KEY, revision integer NOT NULL, care_note text NOT NULL, onboarding_completed_at timestamptz)')
        connection.execute("INSERT INTO public.user_preferences VALUES ('existing', 7, 'existing-private-data', NULL)")
        connection.execute(migration)
        connection.execute(migration)
        assert connection.execute("SELECT revision, care_note, onboarding_completed_at, onboarding_skipped_at FROM public.user_preferences WHERE id='existing'").fetchone() == (7, 'existing-private-data', None, None)
        connection.execute("UPDATE public.user_preferences SET onboarding_skipped_at=clock_timestamp() WHERE id='existing'")
        assert connection.execute("SELECT onboarding_completed_at IS NULL AND onboarding_skipped_at IS NOT NULL FROM public.user_preferences WHERE id='existing'").fetchone()[0]
