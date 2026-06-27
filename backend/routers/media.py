import os
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from typing import List, Optional
from sqlalchemy.orm import Session
from services.user_service import get_current_user
from database import get_db
from uuid import UUID
from models import Media, LanguageLearning
from schemas import (
    MediaResponse,
    VocabularyExtraction
)
from services.media_service import get_media_or_404, create_media_record, save_uploaded_file, \
    extract_and_save_vocabulary
from services.language_service import get_learning_or_404, get_or_create_learning

router = APIRouter(prefix="/media", tags=["Media"])


@router.get("", response_model=List[MediaResponse])
async def get_media(lan: Optional[str] = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Returns all media for the current user, optionally filtered by language."""
    if lan:
        learning = get_learning_or_404(db, lan, current_user.id)
        return db.query(Media).filter(Media.learning_id == learning.id).all()
    else:
        return (
            db.query(Media)
            .join(LanguageLearning, Media.learning_id == LanguageLearning.id)
            .filter(LanguageLearning.user_id == current_user.id)
            .all()
        )


@router.post("", response_model=MediaResponse)
async def post_media(lan: str, title: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db),
                     current_user=Depends(get_current_user)):
    """Upload a Medium"""
    learning = get_or_create_learning(db, lan, current_user.id)
    file_path = save_uploaded_file(file, current_user.id, lan)
    return create_media_record(db, title, file, file_path, learning.id)


@router.post("/{media_id}/vocabulary")
async def extract_media_vocabulary(
        media_id: UUID,
        provider: str | None = None,
        model: str | None = None,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """Extract vocabulary from a medium using LLM"""
    media = get_media_or_404(db, media_id, current_user.id)
    return extract_and_save_vocabulary(db, media, provider, model)


@router.get("/{media_id}", response_model=MediaResponse)
async def get_single_medium(media_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Returns single medium by its UUID."""
    media = get_media_or_404(db, media_id, current_user.id)
    return media


@router.get("/{media_id}/file")
async def get_media_file(media_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Stream the raw file for a medium."""
    media = get_media_or_404(db, media_id, current_user.id)

    if not media.file_path or not os.path.exists(media.file_path):
        raise HTTPException(status_code=404, detail="Datei nicht gefunden")

    filename = os.path.basename(media.file_path)
    content_type = media.content_type or "application/octet-stream"

    return FileResponse(
        path=media.file_path,
        media_type=content_type,
        filename=filename,
    )


@router.delete("/{media_id}")
async def delete_medium(media_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Delete medium by its UUID."""
    media = get_media_or_404(db, media_id, current_user.id)
    db.delete(media)
    db.commit()
    return {"status": "Media deleted"}
