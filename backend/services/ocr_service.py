"""Recognized text (hOCR) for comics and images, stored as a plain file next to the medium:

    uploads/<user_id>/<lan>/<media_id>.cbz      the comic
    uploads/<user_id>/<lan>/<media_id>.hocr     its recognized text

The only thing stored in the database is the medium's extracted_content, which is derived
from this file (see sync_media_text_from_ocr). There is at most one hOCR file per medium;
the viewer matches its pages to the comic's images by file name.
"""
import logging
import os
from dataclasses import dataclass
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from models import Media
from services.hocr import hocr_to_text
from services.media_service import get_media_disk_path
from services.media_text_service import set_extracted_text

logger = logging.getLogger(__name__)

MAX_OCR_BYTES = 64 * 1024 * 1024  # what the viewer reads at most
COMIC_EXTENSIONS = (".cbz", ".cbr", ".cb7", ".cbt")


@dataclass(frozen=True)
class OcrFile:
    path: str
    size: int
    modified: int  # milliseconds since the epoch; changes when the file is replaced


def supports_ocr(media: Media) -> bool:
    """hOCR can be laid over comic pages and single images. A ".zip" counts as page scans
    (archive.org's "*_jp2.zip"), except an FB2 book, which travels as ".fb2.zip"."""
    extension = (media.file_extension or "").lower()
    if extension in COMIC_EXTENSIONS or media.content_type.startswith("image/"):
        return True
    return extension == ".zip" and not (media.original_filename or "").lower().endswith(".fb2.zip")


def get_ocr_path(media: Media) -> str:
    return os.path.splitext(get_media_disk_path(media))[0] + ".hocr"


def find_ocr(media: Media) -> Optional[OcrFile]:
    path = get_ocr_path(media)
    try:
        stat = os.stat(path)
    except FileNotFoundError:
        return None
    return OcrFile(path=path, size=stat.st_size, modified=int(stat.st_mtime * 1000))


def get_ocr_or_404(media: Media) -> OcrFile:
    ocr = find_ocr(media)
    if not ocr:
        raise HTTPException(status_code=404, detail="Keine Texterkennung vorhanden")
    return ocr


def save_ocr(media: Media, data: bytes) -> OcrFile:
    """Writes the hOCR file, replacing an existing one."""
    path = get_ocr_path(media)
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
    return get_ocr_or_404(media)


def remove_ocr_file(path: str) -> None:
    try:
        os.remove(path)
    except FileNotFoundError:
        pass


def sync_media_text_from_ocr(db: Session, media: Media) -> bool:
    """Makes the medium's extracted_content match its hOCR file: the recognized text, one
    paragraph per line. Without an hOCR file (or without text in it) the text is cleared,
    together with everything derived from it (see set_extracted_text).

    Comics and images have no other text source, so nothing else is overwritten.
    Returns True if extracted_content changed, i.e. metadata and embeddings must be regenerated.
    """
    ocr = find_ocr(media)
    new_text = None
    if ocr is not None:
        try:
            with open(ocr.path, "rb") as f:
                new_text = hocr_to_text(f.read()) or None
        except FileNotFoundError:
            # Keep the current text rather than wiping it because of a vanished file
            logger.warning("hOCR file %s of media %s is missing", ocr.path, media.id)
            return False
    return set_extracted_text(db, media, new_text)
