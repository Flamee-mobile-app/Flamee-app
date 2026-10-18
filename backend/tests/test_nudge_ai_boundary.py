"""Hidden mood context must never reach any AI/moderation/template boundary."""
from unittest.mock import Mock

import pytest

from app.services import smart_nudge_service as module


@pytest.mark.parametrize("level", ["mood_only", "private"])
def test_hidden_context_removed_before_external_processing(monkeypatch, level):
    repo = Mock()
    repo.count_nudges_today.return_value = 0
    repo.get_latest_nudge.return_value = None
    service = module.SmartNudgeService(repo, Mock())
    monkeypatch.setattr(service, "_fetch_partner_name", lambda _: "Synthetic partner")
    monkeypatch.setattr(service, "_safe_send_to_user", Mock())
    moderation = Mock(return_value=False)
    generation = Mock(return_value=None)
    template = Mock(return_value={"observation": "Test", "action_type": "text", "draft": "Hello", "reason": "Test", "tone": "gentle"})
    monkeypatch.setattr(module, "detect_crisis_signals", moderation)
    monkeypatch.setattr(service, "_generate_with_provider", generation)
    monkeypatch.setattr(module, "get_template_nudge", template)
    service.trigger_nudge_generation("couple", "sender", "receiver", 3,
                                     ["SECRET_REASON"], "SECRET_NOTE", level)
    if level == "private":
        moderation.assert_not_called()
        generation.assert_not_called()
        repo.create.assert_not_called()
    else:
        moderation.assert_called_once_with(None)
        assert generation.call_args.kwargs["note"] is None
        assert generation.call_args.kwargs["reasons"] is None
        assert template.call_args.args[1] is None
