"""Flamee FastAPI application entrypoint."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.couple import router as couple_router
from app.api.feed import router as feed_router
from app.api.memory import router as memory_router
from app.api.mood import router as mood_router
from app.api.smart_nudge import router as smart_nudge_router
from app.api.subscription import router as subscription_router
from app.api.user import router as user_router
from app.api.ws import router as ws_router
from app.config import settings
from app.core.handlers import register_exception_handlers

API_PREFIX = "/api/v1"


def create_app() -> FastAPI:
    # Production guard — fail fast nếu secret_key mặc định hoặc thiếu OAuth client_id
    settings.assert_production_safe()

    application = FastAPI(title="Flamee API", version="0.3.0")
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_exception_handlers(application)

    for router in (
        auth_router,
        couple_router,
        feed_router,
        memory_router,
        mood_router,
        smart_nudge_router,
        subscription_router,
        user_router,
        ws_router,
    ):
        application.include_router(router, prefix=API_PREFIX)

    @application.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "version": "0.3.0"}

    return application


app = create_app()