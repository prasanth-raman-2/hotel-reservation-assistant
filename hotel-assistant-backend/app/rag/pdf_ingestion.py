import logging
from pathlib import Path

import fitz  # PyMuPDF

from app.core.settings import settings

logger = logging.getLogger(__name__)


def extract_text_from_pdf(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text


def chunk_text(text: str, chunk_size: int = None, overlap: int = None) -> list[str]:
    chunk_size = chunk_size or settings.CHUNK_SIZE
    overlap = overlap or settings.CHUNK_OVERLAP

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        if chunk.strip():
            chunks.append(chunk.strip())
        start += chunk_size - overlap
    return chunks


def ingest_pdf(pdf_path: str | None = None) -> list[str]:
    path = pdf_path or settings.HOTEL_PDF_PATH
    if not Path(path).exists():
        logger.warning("PDF not found at %s — RAG will be empty until a PDF is uploaded.", path)
        return []

    logger.info("Extracting text from %s", path)
    text = extract_text_from_pdf(path)
    chunks = chunk_text(text)
    logger.info("Created %d chunks from PDF", len(chunks))
    return chunks
