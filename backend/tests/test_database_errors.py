import asyncio

from fastapi import Request
from postgrest.exceptions import APIError

from app.core.handlers import postgrest_api_error_handler


def test_missing_migration_returns_stable_service_error_instead_of_raw_500():
    request = Request({"type": "http", "method": "PUT", "path": "/api/v1/auth/me", "headers": []})
    error = APIError({
        "message": "Could not find the 'username' column of 'users' in the schema cache",
        "code": "PGRST204",
        "hint": None,
        "details": None,
    })

    response = asyncio.run(postgrest_api_error_handler(request, error))

    assert response.status_code == 503
    assert b'database_migration_required' in response.body
    assert b'username' not in response.body
