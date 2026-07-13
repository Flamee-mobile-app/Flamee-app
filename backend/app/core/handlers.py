from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.exceptions import DomainError


def _error_payload(code: str, message: str) -> dict:
    return {"success": False, "error": {"code": code, "message": message}}


async def domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
    """Translate any DomainError into the standard error response shape."""
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_payload(exc.code, exc.message),
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Wire domain exception handlers onto a FastAPI app."""
    app.add_exception_handler(DomainError, domain_error_handler)