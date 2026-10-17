from typing import Annotated

from pydantic import StringConstraints

from app.api.response import fail, ok

Username = Annotated[str, StringConstraints(strip_whitespace=True, max_length=40)]

__all__ = ["ok", "fail", "Username"]
