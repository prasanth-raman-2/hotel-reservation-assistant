from fastapi import FastAPI
from fastapi.middleware import Middleware
from fastapi.middleware.cors import CORSMiddleware

from app.core.settings import settings
from app.api.endpoints.chat import router as chat_router
from app.api.endpoints.reservations import router as reservations_router


def init_routers(app: FastAPI) -> None:
    app.include_router(chat_router, prefix="/api")
    app.include_router(reservations_router, prefix="/api")


def make_middleware() -> list[Middleware]:
    return [
        Middleware(
            CORSMiddleware,
            allow_origins=settings.ALLOWED_ORIGINS,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        ),
    ]
