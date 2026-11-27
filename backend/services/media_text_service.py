"""Keeps a medium's extracted_content and everything derived from it in step when the text
comes from a file next to the medium (subtitles for audio/video, hOCR for comics and images)."""
import logging
from typing import Optional
from uuid import UUID

from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from database import SessionLocal
from llm.rag_service import CHUNK_MODELS
from models import Media
from services.media_service import embed_media_safe, generate_media_metadata

logger = logging.getLogger(__name__)


def set_extracted_text(db: Session, media: Media, new_text: Optional[str]) -> bool:
    """Sets the medium's extracted_content. Without text (None) everything derived from it
    is cleared too: summary, topics, genre, difficulty and the embeddings.

    Returns True if extracted_content changed, i.e. metadata and embeddings must be
    regenerated (see regenerate_media_derived_data()).
    """
    if new_text == media.extracted_content:
        return False

    media.extracted_content = new_text
    if new_text is None:
        media.summary = None
        media.topics = None
        media.difficulty_estimate = None
        media.genre = None
        for chunk_model in CHUNK_MODELS.values():
            if chunk_model is not None:
                db.query(chunk_model).filter(chunk_model.media_id == media.id).delete()
    db.commit()
    return True


def regenerate_media_derived_data(background_tasks: BackgroundTasks, media: Media) -> None:
    """Summary/topics/etc. and embeddings are derived from extracted_content, so they
    have to be rebuilt after it changed (there is nothing to rebuild if it was cleared)."""
    if media.extracted_content:
        background_tasks.add_task(generate_media_metadata, media.id)
        background_tasks.add_task(reindex_media, media.id)


def reindex_media(media_id: UUID) -> None:
    """BackgroundTask: re-embeds a medium after its text changed. Opens its own
    DB session, because the request's session is already closed by then."""
    db = SessionLocal()
    try:
        media = db.get(Media, media_id)
        if media:
            embed_media_safe(db, media)
    finally:
        db.close()
