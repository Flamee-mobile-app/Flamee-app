"""Source-level schema checks; these do not replace executing SQL on PostgreSQL."""
from dataclasses import fields
from pathlib import Path
import re

from app.models.user import User
from app.models.couple import Couple, InviteCode
from app.models.memory import Memory, MemoryImage
from app.models.mood import Mood, MoodAlert
from app.models.auth_session import AuthSession
from app.models.smart_nudge import SmartNudge, TinyMoment

ROOT = Path(__file__).resolve().parents[1]


def test_bootstrap_includes_alignment_migration():
    migration = (ROOT / 'migrations/20261017_backend_alignment.sql').read_text(encoding='utf-8')
    schema = (ROOT / 'schema.sql').read_text(encoding='utf-8')
    assert migration.replace('BEGIN;\n', '', 1).strip() in schema


def test_persisted_model_fields_exist_in_schema():
    sql = (ROOT / 'schema.sql').read_text(encoding='utf-8')
    for table, model in {
        'users': User, 'couples': Couple, 'invite_codes': InviteCode,
        'memories': Memory, 'memory_images': MemoryImage,
        'moods': Mood, 'mood_alerts': MoodAlert,
        'auth_sessions': AuthSession, 'smart_nudges': SmartNudge, 'tiny_moments': TinyMoment,
    }.items():
        match = re.search(r'CREATE TABLE (?:IF NOT EXISTS )?(?:public\.)?' + table + r'\s*\((.*?)\n\);', sql, re.S)
        assert match, table
        columns = set(re.findall(r'^\s+(\w+)\s+\w+', match.group(1), re.M))
        columns.update(re.findall(r'ALTER TABLE public\.' + table + r' ADD COLUMN IF NOT EXISTS (\w+)', sql))
        expected = {field.name for field in fields(model)} - {'extra'}
        assert expected <= columns, (table, expected - columns)
