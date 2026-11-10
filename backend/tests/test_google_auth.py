"""Real signature/claim validation with test-only signing keys and cert transport."""
from datetime import datetime, timedelta, timezone
import json
from types import SimpleNamespace

import jwt
import pytest
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID


@pytest.fixture
def google_tokens(monkeypatch):
    from app.config import settings
    from app.services import google_auth
    monkeypatch.setattr(settings, "google_oauth_client_id", "test-web.apps.googleusercontent.com")
    private = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "offline-test-only")])
    now = datetime.now(timezone.utc)
    certificate = (x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(private.public_key())
                   .serial_number(x509.random_serial_number()).not_valid_before(now - timedelta(days=1))
                   .not_valid_after(now + timedelta(days=1)).sign(private, hashes.SHA256()))
    certs = json.dumps({"test-key": certificate.public_bytes(serialization.Encoding.PEM).decode()}).encode()
    monkeypatch.setattr(google_auth, "google_certificate_request", lambda *args, **kwargs: SimpleNamespace(status=200, data=certs))

    def token(seed_nonce, **changes):
        claims = {"sub": "google-sub-123", "email": "google-test@example.com", "email_verified": True,
                  "name": "Google Test", "aud": settings.google_oauth_client_id,
                  "iss": "https://accounts.google.com", "iat": int(now.timestamp()),
                  "exp": int(now.timestamp()) + 300, "nonce": seed_nonce, **changes}
        return jwt.encode(claims, private, algorithm="RS256", headers={"kid": "test-key"})
    return token


def challenge(client):
    response = client.post("/api/v1/auth/google/challenge")
    assert response.status_code == 200
    return response.json()["data"]


def test_unconfigured_google_never_issues_session(client, monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "google_oauth_client_id", "")
    assert client.post("/api/v1/auth/google/challenge").status_code == 501


def test_verified_google_creates_real_backend_session_and_reuses_subject(client, google_tokens, fake_db):
    handshake = challenge(client)
    payload = {"id_token": google_tokens(handshake["nonce"]), "challenge": handshake["challenge"]}
    first = client.post("/api/v1/auth/google", json=payload)
    assert first.status_code == 200, first.text
    second = client.post("/api/v1/auth/google", json=payload)
    assert second.status_code == 200
    assert first.json()["data"]["user"]["id"] == second.json()["data"]["user"]["id"]
    assert len(fake_db.table("users")._data) == 1
    token = first.json()["data"]["access_token"]
    assert client.get("/api/v1/auth/me", headers={"Authorization": "Bearer " + token}).status_code == 200
    assert client.post("/api/v1/auth/logout", headers={"Authorization": "Bearer " + token}).status_code == 200


@pytest.mark.parametrize("claims", [
    {"aud": "attacker.apps.googleusercontent.com"}, {"iss": "https://attacker.invalid"},
    {"exp": 1}, {"email_verified": False}, {"email_verified": "true"}, {"nonce": "wrong-nonce"},
    {"email": "not-email"}, {"sub": ""},
])
def test_invalid_google_claims_cannot_create_account(client, google_tokens, fake_db, claims):
    handshake = challenge(client)
    response = client.post("/api/v1/auth/google", json={"id_token": google_tokens(handshake["nonce"], **claims), "challenge": handshake["challenge"]})
    assert response.status_code == 401
    assert not fake_db.table("users")._data
    assert not fake_db.table("auth_sessions")._data


def test_google_cannot_take_over_password_account_by_matching_email(client, google_tokens, alice_headers):
    account = client.get("/api/v1/auth/me", headers=alice_headers).json()["data"]
    handshake = challenge(client)
    response = client.post("/api/v1/auth/google", json={"id_token": google_tokens(handshake["nonce"], email=account["email"]), "challenge": handshake["challenge"]})
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "google_link_required"


def test_unsigned_or_wrong_challenge_never_logs_in(client, google_tokens):
    handshake = challenge(client)
    for bad in ("not-a-jwt", handshake["challenge"] + "tamper"):
        assert client.post("/api/v1/auth/google", json={"id_token": google_tokens(handshake["nonce"]), "challenge": bad}).status_code == 401


def test_invalid_signature_and_expired_challenge_are_rejected(client, google_tokens):
    from app.config import settings
    handshake = challenge(client)
    valid = google_tokens(handshake["nonce"])
    head, body, signature = valid.split(".")
    altered = ".".join((head, body, ("A" if signature[0] != "A" else "B") + signature[1:]))
    assert client.post("/api/v1/auth/google", json={"id_token": altered, "challenge": handshake["challenge"]}).status_code == 401
    expired = jwt.encode({"type": "google_challenge", "aud": settings.google_oauth_client_id,
                          "nonce": handshake["nonce"], "exp": 1}, settings.secret_key, algorithm="HS256")
    assert client.post("/api/v1/auth/google", json={"id_token": valid, "challenge": expired}).status_code == 401
