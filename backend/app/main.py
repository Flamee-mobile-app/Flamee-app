from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.couple import router as couple_router
from app.api.memory import router as memory_router
from app.config import settings
from app.core.handlers import register_exception_handlers

API_PREFIX = "/api/v1"


def create_app() -> FastAPI:
    application = FastAPI(title="Flamee API", version="0.1.0")
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_exception_handlers(application)

    application.include_router(auth_router, prefix=API_PREFIX)
    application.include_router(couple_router, prefix=API_PREFIX)
    application.include_router(memory_router, prefix=API_PREFIX)

    @application.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @application.on_event("startup")
    def _startup() -> None:
        from app.storage.factory import get_storage, reset_storage
        from mock.seed import seed_if_empty

        reset_storage()
        storage = get_storage()
        if settings.seed:
            seed_if_empty(storage)

    return application


app = create_app()