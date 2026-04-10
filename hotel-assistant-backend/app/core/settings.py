import os
from pathlib import Path

from pydantic_settings import BaseSettings
from pydantic import Field
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    APP_NAME: str = "Hotel Reservation Assistant"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=True)

    # LLM
    LLM_MODEL: str = Field(default="gpt-5-mini", description="LiteLLM model identifier")
    OPENAI_API_KEY: str = Field(default="", description="OpenAI API key (or provider key)")

    # RAG
    CHUNK_SIZE: int = Field(default=500, description="Characters per chunk for PDF splitting")
    CHUNK_OVERLAP: int = Field(default=100, description="Overlap between chunks")
    TOP_K: int = Field(default=5, description="Number of chunks to retrieve")

    # MongoDB
    MONGO_URI: str = Field(
        default="mongodb://localhost:27017",
        description="MongoDB connection URI",
    )
    MONGO_DB_NAME: str = Field(
        default="hotel_assistant",
        description="MongoDB database name",
    )

    # PDF path
    HOTEL_PDF_PATH: str = Field(
        default=str(BASE_DIR / "data" / "hotel_document.pdf"),
        description="Path to the hotel information PDF",
    )

    # CORS
    ALLOWED_ORIGINS: list[str] = Field(default=["*"])


settings = Settings()
