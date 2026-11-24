from dataclasses import replace
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.models.mood import Mood
from app.services.dual_mood_context import DualMoodContext, select_dual_mood_context


NOW = datetime(2026, 11, 16, 18, 0, tzinfo=timezone.utc)
FIRST = Mood(id="a", user_id="a", couple_id="pair", mood="sad", intensity=4, note="private note", is_private=False,
             created_at="2026-11-16T17:59:00Z", mood_score=2, share_level="all", draft_version=2,
             timezone="Asia/Ho_Chi_Minh", local_date="2026-11-17")
SECOND = replace(FIRST, id="b", user_id="b", mood_score=4, timezone="America/Los_Angeles", local_date="2026-11-16")


def test_both_members_are_current_in_their_own_timezones_and_context_contains_only_scores():
    result = select_dual_mood_context(FIRST, SECOND, "pair", NOW)
    assert result == DualMoodContext(2, 4)
    assert not hasattr(result, "note")


def test_missing_stale_private_wrong_pair_or_invalid_data_never_generate_context():
    for second in (None, replace(SECOND, local_date="2026-11-15"), replace(SECOND, is_private=True),
                   replace(SECOND, share_level="mood_only"), replace(SECOND, couple_id="other"),
                   replace(SECOND, user_id="a"), replace(SECOND, mood_score=0), replace(SECOND, timezone="invalid")):
        assert select_dual_mood_context(FIRST, second, "pair", NOW) is None


def test_dual_trigger_waits_for_both_then_generates_for_each_recipient():
    from app.services.mood_service import MoodService

    couple = MagicMock()
    couple.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = SimpleNamespace(data={"partner1_id": "a", "partner2_id": "b"})
    users = MagicMock()
    users.select.return_value.in_.return_value.execute.return_value = SimpleNamespace(data=[{"id": "a", "couple_id": "pair"}, {"id": "b", "couple_id": "pair"}])
    db = MagicMock()
    db.table.side_effect = lambda table: {"couples": couple, "users": users}[table]
    repo = MagicMock()
    service = MoodService(db)
    service.mood_repo = repo
    args = dict(couple_id="pair", sender_id="a", mood_score=2, reasons=["work"], note="private note", share_level="all", draft_version=2)
    with patch("app.utils.time.now_utc", return_value=NOW), patch("app.services.mood_service.now_utc", return_value=NOW), patch("app.services.smart_nudge_service.SmartNudgeService") as factory:
        repo.get_latest_mood.side_effect = [FIRST, None]
        service._trigger_nudge_for_partner(**args)
        factory.return_value.trigger_nudge_generation.assert_not_called()
        repo.get_latest_mood.side_effect = [FIRST, SECOND]
        service._trigger_nudge_for_partner(**args)
        calls = factory.return_value.trigger_nudge_generation.call_args_list
        assert len(calls) == 2
        assert calls[0].kwargs["receiver_score"] == 4 and calls[0].kwargs["mood_score"] == 2
        assert calls[1].kwargs["receiver_score"] == 2 and calls[1].kwargs["mood_score"] == 4


def test_dual_generation_uses_both_scores_without_sending_private_text_to_ai(monkeypatch):
    from app.services import smart_nudge_service as module
    repo = MagicMock()
    repo.get_latest_nudge.return_value = None
    repo.create_guarded.return_value = None
    service = module.SmartNudgeService(repo, MagicMock())
    provider = MagicMock()
    monkeypatch.setattr(service, "_fetch_partner_name", lambda _: "Person")
    monkeypatch.setattr(service, "_generate_with_provider", provider)
    monkeypatch.setattr(module, "detect_crisis_signals", lambda _: False)
    service.trigger_nudge_generation("pair", "a", "b", 5, ["SECRET"], "SECRET NOTE", receiver_score=1)
    low = repo.create_guarded.call_args.args[0]
    service.trigger_nudge_generation("pair", "a", "b", 5, ["SECRET"], "SECRET NOTE", receiver_score=5)
    higher = repo.create_guarded.call_args.args[0]
    assert low["draft"] != higher["draft"]
    assert "SECRET" not in str(low) and "SECRET" not in str(higher)
    provider.assert_not_called()
