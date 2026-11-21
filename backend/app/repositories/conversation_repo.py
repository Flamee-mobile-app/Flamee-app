from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ServiceUnavailableError, ValidationError


class ConversationRepository:
    def __init__(self, db):
        self.db = db

    def execute(self, user_id, action, memory_id=None, target=None, key=None, payload=None):
        result = self.db.rpc("memory_conversation_operation", {
            "p_user": user_id, "p_action": action, "p_memory": memory_id,
            "p_target": target, "p_key": key, "p_payload": payload or {},
        }).execute().data
        if not isinstance(result, dict):
            raise ServiceUnavailableError("Conversation acknowledgement unavailable")
        errors = {"forbidden": ForbiddenError, "not_found": NotFoundError,
                  "conflict": ConflictError, "validation": ValidationError}
        outcome = result.get("outcome")
        if outcome in errors:
            raise errors[outcome]("Conversation changed or is unavailable")
        if outcome != "ok" or not isinstance(result.get("data"), dict):
            raise ServiceUnavailableError("Conversation acknowledgement unavailable")
        return result["data"]
