"""Google identity verification. Never trust client profile data or unsigned JWTs."""
from __future__ import annotations

from datetime import timedelta
import secrets
from uuid import NAMESPACE_URL, uuid5

from google.auth.transport.requests import Request
from google.auth.exceptions import GoogleAuthError, TransportError
from google.oauth2 import id_token
import jwt
from postgrest.exceptions import APIError
from pydantic import BaseModel, EmailStr, ValidationError

from app.config import settings
from app.core.exceptions import AuthError, ConflictError, FeatureUnavailableError
from app.core.security import hash_password
from app.repositories.user_repo import UserRepository
from app.services.auth_service import AuthService
from app.utils.time import now_utc, to_iso


def google_certificate_request(url, method="GET", body=None, headers=None, **kwargs):
    # Bound public certificate retrieval; no token or user data goes to this URL.
    return Request()(url, method=method, body=body, headers=headers, timeout=10)


class VerifiedIdentity(BaseModel):
    email: EmailStr


def _client_id() -> str:
    value = settings.google_oauth_client_id.strip()
    if not value:
        raise FeatureUnavailableError("Google Sign-In chưa được cấu hình.")
    return value


def create_google_challenge() -> dict:
    client_id = _client_id()
    now = now_utc()
    nonce = secrets.token_hex(32)
    challenge = jwt.encode({"type": "google_challenge", "nonce": nonce,
                            "aud": client_id, "iat": now, "exp": now + timedelta(minutes=5)},
                           settings.secret_key, algorithm="HS256")
    return {"challenge": challenge, "nonce": nonce, "expires_in": 300}


def verify_google_identity(token: str, challenge: str) -> dict:
    audience = _client_id()
    try:
        handshake = jwt.decode(challenge, settings.secret_key, algorithms=["HS256"], audience=audience)
        if handshake.get("type") != "google_challenge" or not handshake.get("nonce"):
            raise ValueError("Invalid challenge")
        claims = id_token.verify_oauth2_token(token, google_certificate_request, audience=audience)
        if claims.get("email_verified") is not True or not isinstance(claims.get("sub"), str) or not 1 <= len(claims["sub"]) <= 255:
            raise ValueError("Unverified identity")
        if not isinstance(claims.get("nonce"), str) or not secrets.compare_digest(claims["nonce"], handshake["nonce"]):
            raise ValueError("Nonce mismatch")
        identity = VerifiedIdentity(email=claims.get("email"))
        return {"subject": claims["sub"], "email": str(identity.email).lower(),
                "name": str(claims.get("name") or "Flamee").strip()[:120] or "Flamee"}
    except TransportError:
        raise FeatureUnavailableError("Chưa thể kết nối dịch vụ xác minh Google.") from None
    except (ValueError, jwt.PyJWTError, ValidationError, TypeError, GoogleAuthError):
        raise AuthError("Không thể xác minh tài khoản Google.") from None
    except Exception:
        # No provider response, token or request content in errors/logs.
        raise FeatureUnavailableError("Chưa thể kết nối dịch vụ xác minh Google.") from None


def login_with_google(db, token: str, challenge: str):
    identity = verify_google_identity(token, challenge)
    users = UserRepository(db)
    user = users.find_one({"google_id": identity["subject"]})
    if user is None:
        if users.get_by_email(identity["email"]):
            raise ConflictError("Hãy đăng nhập tài khoản hiện có để liên kết Google.", code="google_link_required")
        now = to_iso(now_utc())
        user_id = str(uuid5(NAMESPACE_URL, "flamee-google:" + identity["subject"]))
        try:
            user = users.create(id=user_id, email=identity["email"], full_name=identity["name"],
                                google_id=identity["subject"], auth_provider="google",
                                password_hash=hash_password(secrets.token_urlsafe(48)),
                                created_at=now, updated_at=now)
        except APIError as error:
            if error.code != "23505":
                raise
            user = users.find_one({"google_id": identity["subject"]})
            if user is None:
                raise ConflictError("Hãy đăng nhập tài khoản hiện có để liên kết Google.", code="google_link_required") from None
    return user, AuthService(users)._issue_session(user.id)
