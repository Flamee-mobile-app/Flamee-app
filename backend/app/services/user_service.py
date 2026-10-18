from supabase import Client
from datetime import datetime

from app.core.security import hash_password
from app.core.exceptions import NotFoundError, ValidationError
from app.repositories.user_repo import UserRepository
from app.models.user import User
from app.services.auth_service import AuthService

class UserService:
    def __init__(self, db: Client):
        self.db = db
        self.user_repo = UserRepository(db)
        
    def get_user(self, user_id: str) -> User:
        user = self.user_repo.get(user_id)
        if not user:
            raise NotFoundError("Không tìm thấy người dùng.")
        return user
        
    def update_profile(self, user_id: str, full_name: str = None, birth_date: str = None, gender: str = None, username: str | None = None, nickname: str | None = None, timezone: str | None = None) -> User:
        return AuthService(self.user_repo).update_profile(
            user_id, full_name, birth_date, gender, username, nickname, timezone,
        )
        
    def update_password(self, user_id: str, current_password: str, new_password: str) -> None:
        from app.services.auth_service import AuthService

        AuthService(self.user_repo).change_password(user_id, current_password, new_password)
        
    def update_fcm_token(self, user_id: str, fcm_token: str) -> User:
        return self.user_repo.update(user_id, fcm_token=fcm_token, updated_at=datetime.utcnow().isoformat() + "Z")
