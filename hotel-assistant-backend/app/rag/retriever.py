import logging
from pathlib import Path

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.core.settings import settings
from app.rag.pdf_ingestion import ingest_pdf

logger = logging.getLogger(__name__)

_collection = None
_client = None


def get_collection():
    global _collection, _client
    if _collection is not None:
        return _collection

    persist_dir = str(Path(settings.HOTEL_PDF_PATH).parent / "chroma_db")
    _client = chromadb.Client(ChromaSettings(
        anonymized_telemetry=False,
        is_persistent=True,
        persist_directory=persist_dir,
    ))
    _collection = _client.get_or_create_collection(
        name="hotel_documents",
        metadata={"hnsw:space": "cosine"},
    )
    return _collection


def build_index() -> int:
    collection = get_collection()

    # Skip if already populated
    if collection.count() > 0:
        logger.info("ChromaDB already has %d documents, skipping ingestion.", collection.count())
        return collection.count()

    chunks = ingest_pdf()
    if not chunks:
        return 0

    ids = [f"chunk_{i}" for i in range(len(chunks))]
    collection.add(documents=chunks, ids=ids)
    logger.info("Indexed %d chunks into ChromaDB.", len(chunks))
    return len(chunks)


def retrieve(query: str, top_k: int = None) -> list[str]:
    top_k = top_k or settings.TOP_K
    collection = get_collection()

    if collection.count() == 0:
        return []

    results = collection.query(query_texts=[query], n_results=top_k)
    documents = results.get("documents", [[]])[0]
    return documents
