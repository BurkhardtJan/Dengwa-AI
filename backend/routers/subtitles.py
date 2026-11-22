import os
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from uuid import UUID

from database import get_db
from schemas import SubtitleResponse
from services.media_service import get_media_or_404, generate_media_metadata
from services.subtitle_parser import SUPPORTED_EXTENSIONS, decode_subtitle_bytes, normalize_language, subtitle_to_text
from services.subtitle_service import (
    MAX_SUBTITLE_BYTES, SubtitleTrack, get_subtitle_track_or_404, list_subtitle_tracks, reindex_media,
    remove_subtitle_files, save_subtitle, source_language, sync_media_text_from_subtitles,
)
from services.user_service import get_current_user

router = APIRouter(prefix="/media/{media_id}/subtitles", tags=["Subtitles"])

MEDIA_TYPES = {".srt": "application/x-subrip", ".vtt": "text/vtt", ".lrc": "text/plain"}


def _to_response(track: SubtitleTrack, source: Optional[str]) -> SubtitleResponse:
    return SubtitleResponse(language=track.language, file_extension=track.file_extension,
                            is_source=track.language == source)


def _regenerate_if_text_present(background_tasks: BackgroundTasks, media) -> None:
    """Summary/topics/etc. and embeddings are derived from extracted_content, so they
    have to be rebuilt after it changed (there is nothing to rebuild if it was cleared)."""
    if media.extracted_content:
        background_tasks.add_task(generate_media_metadata, media.id)
        background_tasks.add_task(reindex_media, media.id)


@router.get("", response_model=List[SubtitleResponse])
async def get_subtitles(media_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Lists the subtitle tracks of a medium, sorted by language. `is_source` marks the
    track whose text feeds the medium's extracted content."""
    media = get_media_or_404(db, media_id, current_user.id)
    tracks = list_subtitle_tracks(media)
    source = source_language(media, tracks)
    return [_to_response(t, source) for t in tracks]


@router.post("", response_model=SubtitleResponse)
async def upload_subtitle(
        media_id: UUID,
        background_tasks: BackgroundTasks,
        file: UploadFile = File(...),
        language: Optional[str] = Form(None),
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user),
):
    """Adds a subtitle track (.srt, .vtt or .lrc) to an audio/video medium.

    `language` is an ISO 639-1 code and defaults to the medium's language. There is one
    track per language: uploading again for the same language replaces it. Only the
    track in the medium's language feeds its extracted content (summary, vocabulary
    extraction, chat context); other tracks are display-only.
    """
    media = get_media_or_404(db, media_id, current_user.id)
    if not media.content_type.startswith(("audio/", "video/")):
        raise HTTPException(status_code=400, detail="Untertitel sind nur für Audio und Video möglich")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=415,
                            detail=f"Nicht unterstütztes Format, erlaubt: {', '.join(SUPPORTED_EXTENSIONS)}")

    data = await file.read(MAX_SUBTITLE_BYTES + 1)
    if len(data) > MAX_SUBTITLE_BYTES:
        raise HTTPException(status_code=413, detail="Untertitel-Datei zu groß")
    if not subtitle_to_text(decode_subtitle_bytes(data)):
        raise HTTPException(status_code=422, detail="Keine Untertitel in der Datei erkannt")

    if language is not None and language.strip():
        lang = normalize_language(language)
        if lang is None:
            raise HTTPException(status_code=422, detail="Ungültiger Sprachcode")
    else:
        lang = media.resolved_language.lower()

    track = save_subtitle(media, lang, ext, data)
    if sync_media_text_from_subtitles(db, media):
        _regenerate_if_text_present(background_tasks, media)
    return _to_response(track, source_language(media, list_subtitle_tracks(media)))


@router.get("/{language}/file")
async def get_subtitle_file(media_id: UUID, language: str, db: Session = Depends(get_db),
                            current_user=Depends(get_current_user)):
    """Stream the raw subtitle file."""
    media = get_media_or_404(db, media_id, current_user.id)
    track = get_subtitle_track_or_404(media, language)
    return FileResponse(
        path=track.path,
        media_type=MEDIA_TYPES.get(track.file_extension, "text/plain"),
        filename=os.path.basename(track.path),
    )


@router.delete("/{language}")
async def delete_subtitle(media_id: UUID, language: str, background_tasks: BackgroundTasks,
                          db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Delete the subtitle track of a language. If it was the source track, the medium's
    text (and what was derived from it) is cleared."""
    media = get_media_or_404(db, media_id, current_user.id)
    track = get_subtitle_track_or_404(media, language)

    remove_subtitle_files([track])
    if sync_media_text_from_subtitles(db, media):
        _regenerate_if_text_present(background_tasks, media)
    return {"status": "Subtitle deleted"}
