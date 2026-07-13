from __future__ import annotations

from typing import Any


def ok(data: Any = None) -> dict:
    """Wrap a payload in the standard success envelope."""
    return {"success": True, "data": data}


def fail(code: str, message: str, details: list | None = None) -> dict:
    """Wrap an error in the standard error envelope."""
    body: dict = {"success": False, "error": {"code": code, "message": message}}
    if details:
        body["error"]["details"] = details
    return body