from app.core.exceptions import ForbiddenError, NotFoundError, ServiceUnavailableError


class MemoryHeartRepository:
    def __init__(self, db):
        self.db = db

    def execute(self, user_id, memory_id, desired=None):
        try:
            result = self.db.rpc("memory_post_heart_operation", {
                "p_user": user_id, "p_memory": memory_id, "p_desired": desired,
            }).execute().data
        except Exception as error:
            raise ServiceUnavailableError("Post reactions are unavailable") from error
        if not isinstance(result, dict):
            raise ServiceUnavailableError("Post reaction acknowledgement unavailable")
        if result.get("outcome") == "forbidden":
            raise ForbiddenError("Post unavailable")
        if result.get("outcome") == "not_found":
            raise NotFoundError("Post unavailable")
        data = result.get("data")
        if result.get("outcome") != "ok" or not isinstance(data, dict):
            raise ServiceUnavailableError("Post reaction acknowledgement unavailable")
        if data.get("memory_id") != memory_id or type(data.get("heart_count")) is not int or data["heart_count"] < 0 or type(data.get("hearted")) is not bool:
            raise ServiceUnavailableError("Post reaction acknowledgement unavailable")
        return data
