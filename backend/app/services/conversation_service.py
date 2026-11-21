class ConversationService:
    def __init__(self, repository):
        self.repository = repository

    def read(self, user_id, action, memory_id=None, *, limit=20, offset=0):
        return self.repository.execute(user_id, action, memory_id, payload={"limit": limit, "offset": offset})

    def change(self, user_id, action, memory_id=None, target=None, key=None, payload=None):
        return self.repository.execute(user_id, action, memory_id, target, key, payload)
