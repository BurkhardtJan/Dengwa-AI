from __future__ import annotations
import re
from sqlalchemy.orm import Session
from langchain_text_splitters import RecursiveCharacterTextSplitter

from llm.providers import get_embedding_model, build_chunk_model_registry, DEFAULT_EMBEDDING_KEY
from models import Media

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
TOP_K = 5

CHUNK_MODELS = build_chunk_model_registry()


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------

def split_srt(content: str) -> list[str]:
    """Splits subtitle blocks to chunks"""
    blocks = re.split(r"\n\n+", content.strip())
    chunks = []
    for block in blocks:
        lines = block.strip().splitlines()
        text_lines = [l for l in lines[2:] if l.strip()]
        if text_lines:
            chunks.append(" ".join(text_lines))
    return [c for c in chunks if c]


def split_normal_text(content: str) -> list[str]:
    """Recursive Character Splitter für TXT, PDF, ..."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ".", " ", ""],
    )
    return splitter.split_text(content)


def split_content(content: str, content_type: str | None = None) -> list[str]:
    if content_type == "application/x-subrip":
        return split_srt(content)
    return split_normal_text(content)


# ---------------------------------------------------------------------------
# Embedding (Offline-Phase)
# ---------------------------------------------------------------------------

def embed_media(db: Session, media: Media, embedding_key: str | None = None) -> int:
    if not media.extracted_content:
        return 0

    embedding_key = embedding_key or DEFAULT_EMBEDDING_KEY
    ChunkModel = CHUNK_MODELS[embedding_key]

    db.query(ChunkModel).filter(ChunkModel.media_id == media.id).delete()
    db.flush()

    chunks = split_content(media.extracted_content, media.content_type)
    if not chunks:
        return 0

    embed_model = get_embedding_model(embedding_key)
    vectors = embed_model.embed_documents(chunks)

    for chunk_text, vector in zip(chunks, vectors):
        db.add(ChunkModel(
            media_id=media.id,
            content=chunk_text,
            embedding=vector,
        ))

    db.commit()
    return len(chunks)


# ---------------------------------------------------------------------------
# Retrieval (Online-Phase)
# ---------------------------------------------------------------------------

def retrieve_context(
        db: Session,
        media_id,
        query: str,
        embedding_key: str | None = None,
        top_k: int = TOP_K,
) -> str:
    embedding_key = embedding_key or DEFAULT_EMBEDDING_KEY
    ChunkModel = CHUNK_MODELS[embedding_key]

    # Lazy indexing
    count = db.query(ChunkModel).filter(ChunkModel.media_id == media_id).count()
    if count == 0:
        media = db.query(Media).filter(Media.id == media_id).first()
        if media and media.extracted_content:
            embed_media(db, media, embedding_key)

    embed_model = get_embedding_model(embedding_key)
    query_vector = embed_model.embed_query(query)

    results = (
        db.query(ChunkModel)
        .filter(ChunkModel.media_id == media_id)
        .order_by(ChunkModel.embedding.cosine_distance(query_vector))
        .limit(top_k)
        .all()
    )

    return "\n\n".join(r.content for r in results)
