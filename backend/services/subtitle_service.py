"""Subtitle tracks for audio/video media, stored as plain files next to the medium's own file:

    uploads/<user_id>/<lan>/<media_id>.mp4          the medium
    uploads/<user_id>/<lan>/<media_id>_es.srt       its Spanish subtitles
    uploads/<user_id>/<lan>/<media_id>_de.vtt       its German subtitles

Nothing is stored in the database except the medium's extracted_content, which is
derived from the track in the medium's language (see sync_media_text_from_subtitles).
The file name carries the language, the extension the format. There is at most one
track per language.
"""
import logging
import os
import re
from dataclasses import dataclass
from typing import Iterable, Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
from llm.rag_service import CHUNK_MODELS
from models import Media
from services.media_service import embed_media_safe, get_media_disk_path
from services.subtitle_parser import (
    SUPPORTED_EXTENSIONS, decode_subtitle_bytes, normalize_language, pick_source_language, subtitle_to_text,
)

logger = logging.getLogger(__name__)

MAX_SUBTITLE_BYTES = 2 * 1024 * 1024


@dataclass(frozen=True)
class SubtitleTrack:
    language: str
    file_extension: str
    path: str


def _media_dir(media: Media) -> str:
    return os.path.dirname(get_media_disk_path(media))


def _track_path(media: Media, language: str, ext: str) -> str:
    return os.path.join(_media_dir(media), f"{media.id}_{language}{ext}")


def _filename_pattern(media_id: UUID) -> re.Pattern:
    extensions = "|".join(re.escape(ext) for ext in SUPPORTED_EXTENSIONS)
    return re.compile(rf"^{re.escape(str(media_id))}_(?P<language>[a-z]{{2,3}}(?:-[a-z0-9]{{2,8}})*)(?P<ext>{extensions})$")


def list_subtitle_tracks(media: Media) -> list[SubtitleTrack]:
    """All subtitle tracks of a medium, sorted by language."""
    directory = _media_dir(media)
    pattern = _filename_pattern(media.id)
    try:
        names = os.listdir(directory)
    except FileNotFoundError:
        return []

    tracks = []
    for name in names:
        match = pattern.match(name)
        if match:
            tracks.append(SubtitleTrack(match["language"], match["ext"], os.path.join(directory, name)))
    return sorted(tracks, key=lambda t: t.language)


def get_subtitle_track_or_404(media: Media, language: str) -> SubtitleTrack:
    normalized = normalize_language(language)
    track = next((t for t in list_subtitle_tracks(media) if t.language == normalized), None)
    if not track:
        raise HTTPException(status_code=404, detail="Untertitel nicht gefunden")
    return track


def source_language(media: Media, tracks: Iterable[SubtitleTrack]) -> Optional[str]:
    return pick_source_language((t.language for t in tracks), media.resolved_language)


def save_subtitle(media: Media, language: str, ext: str, data: bytes) -> SubtitleTrack:
    """Writes the track and replaces an existing one for the same language (any format)."""
    path = _track_path(media, language, ext)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp_path = path + ".tmp"
    try:
        with open(tmp_path, "wb") as f:
            f.write(data)
        os.replace(tmp_path, path)
    except OSError as e:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise HTTPException(status_code=500, detail=f"Fehler beim Speichern der Datei: {e}")

    for old in list_subtitle_tracks(media):
        if old.language == language and old.file_extension != ext:
            os.remove(old.path)
    return SubtitleTrack(language, ext, path)


def remove_subtitle_files(tracks: Iterable[SubtitleTrack]) -> None:
    for track in tracks:
        try:
            os.remove(track.path)
        except FileNotFoundError:
            pass


def sync_media_text_from_subtitles(db: Session, media: Media) -> bool:
    """Makes the medium's extracted_content match its subtitle tracks.

    Only the track in the medium's language feeds the text (see pick_source_language);
    tracks in other languages are display-only, so e.g. a German translation never ends
    up in the vocabulary of a Spanish medium. Without such a track the text is cleared
    again, together with everything derived from it (summary, topics, genre,
    difficulty, embeddings).

    Returns True if extracted_content changed, i.e. metadata and embeddings must be
    regenerated.
    """
    tracks = list_subtitle_tracks(media)
    language = source_language(media, tracks)
    source = next((t for t in tracks if t.language == language), None)

    new_text = None
    if source is not None:
        try:
            with open(source.path, "rb") as f:
                new_text = subtitle_to_text(decode_subtitle_bytes(f.read())) or None
        except FileNotFoundError:
            # Keep the current text rather than wiping it because of a vanished file
            logger.warning("Source subtitle file %s of media %s is missing", source.path, media.id)
            return False

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
