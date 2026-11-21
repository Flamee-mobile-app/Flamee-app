"""Select the minimum server-confirmed context for a two-person daily nudge."""
from dataclasses import dataclass
from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.models.mood import Mood


@dataclass(frozen=True)
class DualMoodContext:
    first_score: int
    second_score: int


def select_dual_mood_context(first: Mood | None, second: Mood | None, couple_id: str, now: datetime) -> DualMoodContext | None:
    """Fail closed when either user has not shared a v2 check-in today in their timezone."""
    if not first or not second or not couple_id or first.user_id == second.user_id or now.tzinfo is None:
        return None
    for mood in (first, second):
        if mood.couple_id != couple_id or mood.is_private or mood.share_level != "all" or mood.draft_version != 2:
            return None
        if not isinstance(mood.mood_score, int) or isinstance(mood.mood_score, bool) or not 1 <= mood.mood_score <= 5:
            return None
        try:
            if mood.local_date != now.astimezone(ZoneInfo(mood.timezone)).date().isoformat():
                return None
        except (ZoneInfoNotFoundError, ValueError, TypeError):
            return None
    # Do not expose note, attachments or other private content to the generator.
    return DualMoodContext(first_score=first.mood_score, second_score=second.mood_score)
