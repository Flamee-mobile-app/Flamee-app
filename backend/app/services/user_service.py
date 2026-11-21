from supabase import Client
from datetime import datetime

from app.core.security import hash_password
from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.repositories.user_repo import UserRepository
from app.models.user import User
from app.services.auth_service import AuthService
from app.repositories.preferences_repo import PreferencesRepository
from app.schemas.user import PreferencesResponse, PreferencesValue, UpdatePreferencesRequest
from app.utils.time import now_utc

class UserService:
    def __init__(self, db: Client):
        self.db = db
        self.user_repo = UserRepository(db)

    def get_preferences(self, user_id: str) -> PreferencesResponse:
        repo = PreferencesRepository(self.db)
        record = repo.get(user_id)
        if record is None:
            user = self.get_user(user_id)
            values = PreferencesValue(timezone=user.timezone).model_dump()
            record = repo.create(user_id, {**values, 'revision': 0, 'onboarding_completed_at': None})
        return PreferencesResponse.model_validate({key: value for key, value in record.items()
                                                   if key in PreferencesResponse.model_fields})

    def update_preferences(self, user_id: str, payload: UpdatePreferencesRequest) -> PreferencesResponse:
        current = self.get_preferences(user_id)
        values = payload.model_dump(exclude={'revision', 'complete_onboarding'})
        values.update(revision=payload.revision + 1, updated_at=now_utc().isoformat(),
                      onboarding_completed_at=current.onboarding_completed_at or (now_utc().isoformat() if payload.complete_onboarding else None))
        record = PreferencesRepository(self.db).update(user_id, payload.revision, values)
        return PreferencesResponse.model_validate({key: value for key, value in record.items()
                                                   if key in PreferencesResponse.model_fields})

    def onboarding_status(self, user_id: str) -> dict:
        self.get_preferences(user_id)
        record = PreferencesRepository(self.db).get_onboarding(user_id)
        if record is None:
            raise NotFoundError("Không tìm thấy thông tin thiết lập.")
        return {"status": "completed" if record.get("onboarding_completed_at") else "skipped" if record.get("onboarding_skipped_at") else "pending"}

    def skip_onboarding(self, user_id: str) -> dict:
        repo = PreferencesRepository(self.db)
        for _ in range(2):
            self.get_preferences(user_id)
            record = repo.get_onboarding(user_id)
            if record is None:
                raise NotFoundError("Không tìm thấy thông tin thiết lập.")
            if record.get("onboarding_completed_at"):
                return {"status": "completed"}
            if record.get("onboarding_skipped_at"):
                return {"status": "skipped"}
            try:
                now = now_utc().isoformat()
                repo.update(user_id, record['revision'], {"onboarding_skipped_at": now, "updated_at": now, "revision": record['revision'] + 1})
                return {"status": "skipped"}
            except ConflictError:
                continue
        raise ConflictError("Preferences changed; retry.", code="preferences_revision_conflict")
        
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
