class MemoryHeartService:
    def __init__(self, repository):
        self.repository = repository

    def read(self, user_id, memory_id):
        return self.repository.execute(user_id, memory_id)

    def set(self, user_id, memory_id, desired):
        return self.repository.execute(user_id, memory_id, desired)
