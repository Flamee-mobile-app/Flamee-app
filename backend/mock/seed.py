from __future__ import annotations

from datetime import date

from app.core.constants import (
    COUPLES,
    COUPLE_MEMBERS,
    MEMORIES,
    USERS,
)
from app.core.security import hash_password
from app.storage.base import Storage
from app.utils.ids import generate_uuid
from app.utils.time import now_utc, to_iso, today_utc_date

DEMO_PASSWORD = "Demo1234!"
_DEMO_USERS: list[dict] = [
    {"email": "alice@demo.com", "full_name": "Alice"},
    {"email": "bob@demo.com", "full_name": "Bob"},
]

_MEMORY_TEMPLATES: list[dict] = [
    {
        "title": "First date at the coffee shop",
        "description": "We talked for hours over lattes.",
        "category": "first_date",
        "memory_date_offset_days": -650,
        "location": "The Coffee House",
    },
    {
        "title": "Beach trip to Da Nang",
        "description": "Watched the sunrise together.",
        "category": "trip",
        "memory_date_offset_days": -380,
        "location": "Da Nang",
    },
    {
        "title": "Our first anniversary",
        "description": "Dinner by the river.",
        "category": "anniversary",
        "memory_date_offset_days": -280,
        "location": "Riverside Restaurant",
    },
    {
        "title": "Adopted a puppy!",
        "description": "Welcome home, Mochi.",
        "category": "milestone",
        "memory_date_offset_days": -120,
        "location": "Home",
    },
    {
        "title": "Surprise birthday gift",
        "description": "Custom leather journal.",
        "category": "gift",
        "memory_date_offset_days": -45,
        "location": "Home",
    },
]


def seed_if_empty(storage: Storage) -> None:
    """Seed demo users (alice, bob), 1 couple, and 5 memories if storage is empty."""
    if storage.count(USERS) > 0:
        return
    now_iso = to_iso(now_utc())
    today = today_utc_date()
    user_records = _insert_demo_users(storage, now_iso)
    alice, bob = user_records
    couple_id = _insert_demo_couple(storage, alice, bob, today, now_iso)
    _insert_demo_memories(storage, couple_id, alice["id"], today, now_iso)


def _insert_demo_users(storage: Storage, now_iso: str) -> list[dict]:
    records: list[dict] = []
    for spec in _DEMO_USERS:
        record = {
            "id": generate_uuid(),
            "email": spec["email"],
            "password_hash": hash_password(DEMO_PASSWORD),
            "full_name": spec["full_name"],
            "avatar_url": None,
            "birth_date": None,
            "gender": None,
            "couple_id": None,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        storage.insert(USERS, record)
        records.append(record)
    return records


def _insert_demo_couple(
    storage: Storage,
    alice: dict,
    bob: dict,
    today: date,
    now_iso: str,
) -> str:
    couple_id = generate_uuid()
    storage.insert(
        COUPLES,
        {
            "id": couple_id,
            "partner1_id": alice["id"],
            "partner2_id": bob["id"],
            "anniversary": today.isoformat(),
            "status": "active",
            "created_at": now_iso,
            "updated_at": now_iso,
        },
    )
    _insert_member(storage, couple_id, alice["id"], "partner1", now_iso)
    _insert_member(storage, couple_id, bob["id"], "partner2", now_iso)
    return couple_id


def _insert_member(
    storage: Storage,
    couple_id: str,
    user_id: str,
    role: str,
    now_iso: str,
) -> None:
    storage.insert(
        COUPLE_MEMBERS,
        {
            "id": generate_uuid(),
            "couple_id": couple_id,
            "user_id": user_id,
            "role": role,
            "joined_at": now_iso,
        },
    )


def _insert_demo_memories(
    storage: Storage,
    couple_id: str,
    created_by: str,
    today: date,
    now_iso: str,
) -> None:
    for template in _MEMORY_TEMPLATES:
        offset = template["memory_date_offset_days"]
        memory_date = date.fromordinal(today.toordinal() + offset).isoformat()
        storage.insert(
            MEMORIES,
            {
                "id": generate_uuid(),
                "couple_id": couple_id,
                "created_by": created_by,
                "title": template["title"],
                "description": template["description"],
                "category": template["category"],
                "memory_date": memory_date,
                "location": template["location"],
                "is_pinned": False,
                "reminder_enabled": False,
                "created_at": now_iso,
                "updated_at": now_iso,
            },
        )