"""Configuration and application startup regression checks (no external services)."""
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.config import Settings


def make_settings(**overrides):
    with patch.dict("os.environ", {}, clear=True):
        return Settings(_env_file=None, **overrides)


def test_development_startup():
    from app.main import create_app

    with patch("app.main.settings", make_settings()):
        with TestClient(create_app()) as client:
            assert client.get("/health").json()["status"] == "ok"
            assert client.get("/docs").status_code == 200
            assert client.get("/openapi.json").status_code == 200


@pytest.mark.parametrize("secret", ["", "short", " " * 32, "change-in-production-min-32-chars"])
def test_production_rejects_unsafe_secret(secret):
    config = make_settings(debug=False, secret_key=secret, google_oauth_client_id="test-client")
    with pytest.raises(ValueError, match="FLAMEE_SECRET_KEY"):
        config.assert_production_safe()


def test_production_requires_oauth_client():
    with pytest.raises(ValueError, match="FLAMEE_GOOGLE_OAUTH_CLIENT_ID"):
        make_settings(debug=False, secret_key="test-secret-" * 4).assert_production_safe()


def test_production_accepts_configured_credentials():
    make_settings(
        debug=False, secret_key="test-secret-" * 4, google_oauth_client_id="test-client"
    ).assert_production_safe()


def test_ai_providers_can_be_constructed_without_network():
    from app.ai.gemini_provider import GeminiProvider
    from app.ai.openai_provider import OpenAIProvider

    with patch("app.ai.openai_provider.settings", make_settings()):
        OpenAIProvider()
    with patch("app.ai.gemini_provider.settings", make_settings(ai_provider="gemini")):
        GeminiProvider()


def test_example_environment_loads():
    with patch.dict("os.environ", {}, clear=True):
        config = Settings(_env_file=".env.example")
    assert config.cors_origins == ["*"]
    assert config.jwt_refresh_ttl_days == 30
    config.assert_production_safe()
