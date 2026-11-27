from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from uuid import UUID

from database import get_db
from schemas import OcrResponse
from services.hocr import looks_like_hocr
from services.media_service import get_media_or_404
from services.media_text_service import regenerate_media_derived_data
from services.ocr_service import (
    MAX_OCR_BYTES, OcrFile, get_ocr_or_404, remove_ocr_file, save_ocr, supports_ocr, sync_media_text_from_ocr,
)
from services.user_service import get_current_user

router = APIRouter(prefix="/media/{media_id}/ocr", tags=["OCR"])


def _to_response(ocr: OcrFile) -> OcrResponse:
    return OcrResponse(size=ocr.size, modified=ocr.modified)


@router.get("", response_model=OcrResponse)
async def get_ocr(media_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Info about the recognized text (hOCR) of a medium; 404 if there is none."""
    media = get_media_or_404(db, media_id, current_user.id)
    return _to_response(get_ocr_or_404(media))


@router.put("", response_model=OcrResponse)
async def upload_ocr(media_id: UUID, background_tasks: BackgroundTasks, file: UploadFile = File(...),
                     db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Sets the recognized text (hOCR, e.g. from Tesseract) of a comic or image; an existing
    one is replaced. The viewer matches its pages to the comic's images by file name.

    The recognized text also becomes the medium's extracted content (summary, vocabulary
    extraction, chat context), like the source subtitle track does for audio/video."""
    media = get_media_or_404(db, media_id, current_user.id)
    if not supports_ocr(media):
        raise HTTPException(status_code=400, detail="Texterkennung ist nur für Comics und Bilder möglich")

    data = await file.read(MAX_OCR_BYTES + 1)
    if len(data) > MAX_OCR_BYTES:
        raise HTTPException(status_code=413, detail="hOCR-Datei zu groß")
    if not looks_like_hocr(data):
        raise HTTPException(status_code=422, detail="Die Datei ist keine hOCR-Datei")

    ocr = save_ocr(media, data)
    if sync_media_text_from_ocr(db, media):
        regenerate_media_derived_data(background_tasks, media)
    return _to_response(ocr)


@router.get("/file")
async def get_ocr_file(media_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Stream the raw hOCR file."""
    media = get_media_or_404(db, media_id, current_user.id)
    ocr = get_ocr_or_404(media)
    return FileResponse(path=ocr.path, media_type="text/html", filename=f"{media.id}.hocr")


@router.delete("")
async def delete_ocr(media_id: UUID, background_tasks: BackgroundTasks, db: Session = Depends(get_db),
                     current_user=Depends(get_current_user)):
    """Remove the recognized text of a medium; the extracted content derived from it is cleared."""
    media = get_media_or_404(db, media_id, current_user.id)
    remove_ocr_file(get_ocr_or_404(media).path)
    if sync_media_text_from_ocr(db, media):
        regenerate_media_derived_data(background_tasks, media)
    return {"status": "OCR deleted"}
