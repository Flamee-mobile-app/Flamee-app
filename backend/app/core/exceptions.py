from __future__ import annotations


class DomainError(Exception):
    """Base class for all domain-level errors.

    These are framework-agnostic and get translated to HTTP responses
    by the handlers in app.core.handlers.
    """

    code: str = "domain_error"
    status_code: int = 400

    def __init__(self, message: str, *, code: str | None = None) -> None:
        super().__init__(message)
        self.message = message
        if code is not None:
            self.code = code


class AuthError(DomainError):
    code = "unauthorized"
    status_code = 401


class ForbiddenError(DomainError):
    code = "forbidden"
    status_code = 403


class NotFoundError(DomainError):
    code = "not_found"
    status_code = 404


class ConflictError(DomainError):
    code = "conflict"
    status_code = 409


class ValidationError(DomainError):
    code = "validation_error"
    status_code = 400