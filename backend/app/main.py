from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.couple import router as couple_router
from app.api.memory import router as memory_router
from app.api.chat import router as chat_router
from app.api.mood import router as mood_router
from app.api.user import router as user_router
from app.api.feed import router as feed_router
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
    application.include_router(chat_router, prefix=API_PREFIX)
    application.include_router(mood_router, prefix=API_PREFIX)
    application.include_router(user_router, prefix=API_PREFIX)
    application.include_router(feed_router, prefix=API_PREFIX)

    @application.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "version": "0.1.0"}

    return application


app = create_app()