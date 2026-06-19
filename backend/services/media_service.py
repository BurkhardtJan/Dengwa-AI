import os
import shutil
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session
from uuid import UUID
from models import Media, MediaVocabulary, LanguageLearning
from schemas import VocabularyExtraction
from llm.prompts import build_vocab_extract_prompt
from llm.client import call_llm
from services.vocabulary_service import get_or_create_vocab

OCTET_STREAM_EXTENSIONS = {".txt", ".srt", ".vtt", ".md"}


def read_text_file(file_path: str) -> str:
    """Helper function to read text file"""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except UnicodeDecodeError:
        with open(file_path, "r", encoding="latin-1") as f:
            return f.read()


def extract_content(content_type: str, file_path: str) -> str | None:
    """Helper function to extract content from files"""
    if content_type.startswith("text/"):
        return read_text_file(file_path)

    if content_type == "application/x-subrip":
        return read_text_file(file_path)

    if content_type == "application/octet-stream":
        ext = os.path.splitext(file_path)[1].lower()
        if ext in OCTET_STREAM_EXTENSIONS:
            return read_text_file(file_path)

    return None


def get_media_or_404(db: Session, media_id: UUID, user_id: UUID) -> Media:
    """Returns a Media record or raises 404."""
    media = (
        db.query(Media)
        .join(LanguageLearning, Media.learning_id == LanguageLearning.id)
        .filter(
            Media.id == media_id,
            LanguageLearning.user_id == user_id,
        )
        .first()
    )
    if not media:
        raise HTTPException(status_code=404, detail="Medium nicht gefunden")
    return media


def create_media_vocab(
        db: Session,
        media_id: UUID,
        learning_id: UUID,
        word: str,
        translation: str | None = None,
        context_sentence: str | None = None,
        language: str | None = None,
) -> MediaVocabulary:
    """
    Creates media vocabulary and if necessary normal vocabulary.
    """

    vocab = get_or_create_vocab(
        db=db,
        learning_id=learning_id,
        word=word,
        translation=translation,
        context_sentence=context_sentence,
        language=language
    )

    existing_link = (
        db.query(MediaVocabulary)
        .filter(
            MediaVocabulary.media_id == media_id,
            MediaVocabulary.vocabulary_id == vocab.id
        )
        .first()
    )

    if existing_link:
        return existing_link

    media_vocab_link = MediaVocabulary(
        media_id=media_id,
        vocabulary_id=vocab.id
    )

    db.add(media_vocab_link)
    db.commit()
    db.refresh(media_vocab_link)

    return media_vocab_link


def extract_and_save_vocabulary(db: Session, media: Media, provider, model) -> VocabularyExtraction:
    """
    Calls the LLM to extract vocabulary from a media item and persists results to DB.
    Returns the structured LLM response.
    """
    system_prompt = build_vocab_extract_prompt(media)
    messages = [{"role": "user", "content": "Gib zwischen 10 Vokabeln zurück"}]

    response_structured = call_llm(
        messages=messages,
        system_prompt=system_prompt,
        provider=provider,
        model=model,
        temperature=0.2,
        response_schema=VocabularyExtraction
    )

    for item in response_structured.vocabularies:
        create_media_vocab(
            db,
            media.id,
            media.learning_id,
            item.word,
            item.translation,
            item.context_sentence,
            media.language_learning.learning_language
        )

    return response_structured


def save_uploaded_file(file: UploadFile, user_id: UUID, lan: str) -> str:
    """
    Saves an uploaded file to uploads/<user_id>/<lan>/<filename>.
    Returns the file path.
    Raises HTTPException on write error.
    """
    user_lan_dir = os.path.join("uploads", str(user_id), lan)
    os.makedirs(user_lan_dir, exist_ok=True)
    file_path = os.path.join(user_lan_dir, file.filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Speichern der Datei: {str(e)}")

    return file_path


def create_media_record(db: Session, title: str, file: UploadFile, file_path: str, learning_id: int) -> Media:
    """Creates and persists a Media DB record."""
    media = Media(
        title=title,
        content_type=file.content_type,
        file_path=file_path,
        extracted_content=extract_content(file.content_type, file_path),
        learning_id=learning_id
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    return media
