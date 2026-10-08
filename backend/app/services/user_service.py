from supabase import Client
from datetime import datetime

from app.core.security import hash_password
from app.core.exceptions import NotFoundError, ValidationError
from app.repositories.user_repo import UserRepository
from app.models.user import User

class UserService:
    def __init__(self, db: Client):
        self.db = db
        self.user_repo = UserRepository(db)
        
    def get_user(self, user_id: str) -> User:
        user = self.user_repo.get(user_id)
        if not user:
            raise NotFoundError("Không tìm thấy người dùng.")
        return user
        
    def update_profile(self, user_id: str, full_name: str = None, avatar_url: str = None, birth_date: str = None, gender: str = None) -> User:
        patch = {"updated_at": datetime.utcnow().isoformat() + "Z"}
        if full_name is not None: patch["full_name"] = full_name
        if avatar_url is not None: patch["avatar_url"] = avatar_url
        if birth_date is not None: patch["birth_date"] = birth_date
        if gender is not None: patch["gender"] = gender
        
        return self.user_repo.update(user_id, **patch)
        
    def update_password(self, user_id: str, new_password: str) -> User:
        if len(new_password) < 6:
            raise ValidationError("Mật khẩu phải có ít nhất 6 ký tự.")
            
        hashed = hash_password(new_password)
        return self.user_repo.update(user_id, password_hash=hashed, updated_at=datetime.utcnow().isoformat() + "Z")
        
    def update_fcm_token(self, user_id: str, fcm_token: str) -> User:
        return self.user_repo.update(user_id, fcm_token=fcm_token, updated_at=datetime.utcnow().isoformat() + "Z")
