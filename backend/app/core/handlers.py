"""Exception handlers cho FastAPI."""
from __future__ import annotations

import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from postgrest.exceptions import APIError

from app.core.exceptions import DomainError

logger = logging.getLogger(__name__)


def _error_payload(code: str, message: str) -> dict:
    return {"success": False, "error": {"code": code, "message": message}}


async def domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
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


async def validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """422 từ Pydantic về cùng envelope."""
    errors = exc.errors()
    first = errors[0] if errors else {}
    loc = ".".join(str(p) for p in first.get("loc", []) if p not in ("body",))
    msg = first.get("msg", "Dữ liệu không hợp lệ")
    detail = f"{loc}: {msg}" if loc else msg
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=_error_payload("validation_error", detail),
    )


async def http_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all cho HTTPException raise thủ công trong route handlers."""
    from fastapi import HTTPException

    if isinstance(exc, HTTPException):
        detail = exc.detail if isinstance(exc.detail, str) else "Lỗi yêu cầu"
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_payload(
                _code_from_status(exc.status_code), detail
            ),
        )
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(
        status_code=500,
        content=_error_payload("internal_error", "Lỗi máy chủ nội bộ"),
    )


def _code_from_status(status_code: int) -> str:
    return {
        400: "bad_request",
        401: "unauthorized",
        403: "forbidden",
        404: "not_found",
        409: "conflict",
        422: "validation_error",
    }.get(status_code, "error")


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(APIError, postgrest_api_error_handler)
    app.add_exception_handler(DomainError, domain_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(Exception, http_error_handler)
