from enum import Enum


class MoodType(str, Enum):
    LOVE = "love"
    HAPPY = "happy"
    EXCITED = "excited"
    CALM = "calm"
    NEUTRAL = "neutral"
    TIRED = "tired"
    SAD = "sad"
    ANGRY = "angry"
    ANXIOUS = "anxious"
    SICK = "sick"


class MemoryCategory(str, Enum):
    FIRST_DATE = "first_date"
    ANNIVERSARY = "anniversary"
    TRIP = "trip"
    MILESTONE = "milestone"
    GIFT = "gift"
    MOMENT = "moment"
    OTHER = "other"


class InviteCodeStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class CoupleStatus(str, Enum):
    ACTIVE = "active"
    DISSOLVED = "dissolved"



# Collection / table names
USERS = "users"
COUPLES = "couples"
INVITE_CODES = "invite_codes"
MEMORIES = "memories"
MEMORY_IMAGES = "memory_images"

# Auth / token constants
OTP_LENGTH = 6
INVITE_CODE_PREFIX = "FLM"
INVITE_CODE_LENGTH = 6

# Moods considered negative (for mood insights later)
_NEGATIVE_MOODS: frozenset[str] = frozenset(
    {MoodType.SAD.value, MoodType.ANGRY.value, MoodType.ANXIOUS.value, MoodType.SICK.value}
)


def is_negative_mood(mood: str) -> bool:
    """Return True if a mood value is in the negative-mood set."""
    return mood in _NEGATIVE_MOODS