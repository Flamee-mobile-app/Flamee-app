from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from postgrest.exceptions import APIError

from app.core.exceptions import DomainError


def _error_payload(code: str, message: str) -> dict:
    return {"success": False, "error": {"code": code, "message": message}}


async def domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
    """Translate any DomainError into the standard error response shape."""
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_payload(exc.code, exc.message),
    )


async def postgrest_api_error_handler(request: Request, exc: APIError) -> JSONResponse:
    if exc.code == "PGRST204":
        return JSONResponse(
            status_code=503,
            content=_error_payload(
                "database_migration_required",
                "Database schema is not ready for this operation.",
            ),
        )
    return JSONResponse(
        status_code=502,
        content=_error_payload("database_error", "Database request failed."),
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Wire domain exception handlers onto a FastAPI app."""
    app.add_exception_handler(DomainError, domain_error_handler)
    app.add_exception_handler(APIError, postgrest_api_error_handler)
