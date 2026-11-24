from app.core.exceptions import ForbiddenError, NotFoundError, ServiceUnavailableError, ValidationError


class MoodReminderRepository:
    def __init__(self, db):
        self.db = db

    def capabilities(self):
        try:
            result = self.db.rpc("mood_e2e_capabilities", {}).execute().data
        except Exception as error:
            raise ServiceUnavailableError("Mood service is not ready") from error
        if not isinstance(result, dict) or type(result.get("dual_mood_nudge")) is not bool:
            raise ServiceUnavailableError("Mood service is not ready")
        return result

    def execute(self, user_id, action, timezone="UTC", target=None, limit=20, offset=0):
        try:
            result = self.db.rpc("mood_daily_reminder_operation", {
                "p_user": user_id, "p_action": action, "p_timezone": timezone, "p_target": target, "p_limit": limit, "p_offset": offset,
            }).execute().data
        except Exception as error:
            raise ServiceUnavailableError("Mood reminders are unavailable") from error
        if not isinstance(result, dict):
            raise ServiceUnavailableError("Mood reminder acknowledgement unavailable")
        errors = {"forbidden": ForbiddenError, "not_found": NotFoundError, "validation": ValidationError}
        if result.get("outcome") in errors:
            raise errors[result["outcome"]]("Mood reminder unavailable")
        if result.get("outcome") != "ok" or not isinstance(result.get("data"), dict):
            raise ServiceUnavailableError("Mood reminder acknowledgement unavailable")
        return result["data"]
