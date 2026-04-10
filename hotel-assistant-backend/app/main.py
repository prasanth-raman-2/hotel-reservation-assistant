import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI

from app.core.settings import settings
from app.core.modules import init_routers, make_middleware
from app.core.database import connect_db
from app.rag.retriever import build_index

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app_: FastAPI):
    # Startup
    data_dir = Path(settings.HOTEL_PDF_PATH).parent
    data_dir.mkdir(parents=True, exist_ok=True)

    logger.info("Connecting to MongoDB...")
    connect_db()

    logger.info("Building RAG index...")
    count = build_index()
    if count > 0:
        logger.info("RAG index ready with %d chunks.", count)
    else:
        logger.warning("No PDF found. Upload via POST /api/reservations/upload-pdf")

    yield
    # Shutdown


def create_app() -> FastAPI:
    app_ = FastAPI(
        title=settings.APP_NAME,
        description="AI-powered hotel assistant with RAG-based Q&A and reservation management.",
        version=settings.APP_VERSION,
        lifespan=lifespan,
        middleware=make_middleware(),
    )
    init_routers(app_)

    @app_.get("/health")
    async def health_check():
        return {
            "status": "healthy",
            "service": settings.APP_NAME,
            "version": settings.APP_VERSION,
        }

    return app_


app = create_app()
