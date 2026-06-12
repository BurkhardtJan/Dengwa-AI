import os
import shutil
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from models import LanguageLearning, Media, Vocabulary, MediaVocabulary, Chat, ChatHistory, LearningProgress, User
from schemas import (
    LanguageLearningResponse,
    MediaResponse,
    VocabularyResponse, VocabularyCreate, VocabularyUpdate,
    ChatCreate, ChatResponse,
    ChatMessageRequest, ChatMessageResponse,
    VocabularyExtraction)
from prompts import build_system_prompt_language_chat, build_vocab_extract_prompt
from vocabulary import create_vocab, get_or_create_vocab, create_media_vocab
from llm_service import call_llm
from media_processing import extract_content


def get_current_user():
    """Gets id of current user by Auth"""
    # TODO: AUTH
    return {"id": 1}


def get_learning_or_404(db: Session, lan: str, user_id: int):
    """Gets learning info by user and language. Creates 404 if not found."""
    learning = (
        db.query(LanguageLearning)
        .filter(
            LanguageLearning.learning_language == lan,
            LanguageLearning.user_id == user_id
        )
        .first()
    )

    if not learning:
        raise HTTPException(
            status_code=404,
            detail="Language learning not found"
        )

    return learning


def get_or_create_learning(db: Session, lan: str, user_id: int) -> LanguageLearning:
    """Gets learning info by user and language. Creates new learning id if not found."""
    learning = (
        db.query(LanguageLearning)
        .filter(
            LanguageLearning.learning_language == lan,
            LanguageLearning.user_id == user_id
        )
        .first()
    )

    if not learning:
        learning = LanguageLearning(
            user_id=user_id,
            learning_language=lan,
            proficiency_level="A0"
        )
        db.add(learning)
        db.commit()
        db.refresh(learning)

    return learning


def get_media_or_404(db: Session, media_id: int) -> Media:
    """Returns a Media record or raises 404."""
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Medium nicht gefunden oder Zugriff verweigert.")
    return media


def get_vocab_or_404(db: Session, vocab_id: int, learning_id: int) -> Vocabulary:
    """Returns a Vocabulary record scoped to a learning entry, or raises 404."""
    vocab = (
        db.query(Vocabulary)
        .filter(
            Vocabulary.id == vocab_id,
            Vocabulary.learning_id == learning_id
        )
        .first()
    )
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    return vocab


def get_chat_or_404(db: Session, chat_id: int, user_id: int) -> Chat:
    """Returns a Chat by user_chat_id scoped to a user, or raises 404."""
    chat = db.query(Chat).filter(Chat.user_chat_id == chat_id, Chat.user_id == user_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


def extract_and_save_vocabulary(db: Session, media: Media, response_schema) -> VocabularyExtraction:
    """
    Calls the LLM to extract vocabulary from a media item and persists results to DB.
    Returns the structured LLM response.
    """
    system_prompt = build_vocab_extract_prompt(media)
    messages = [{"role": "user", "content": "Gib zwischen 10 Vokabeln zurück"}]

    response_structured = call_llm(
        messages=messages,
        system_prompt=system_prompt,
        provider="openai",
        temperature=0.2,
        response_schema=response_schema
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


def save_uploaded_file(file: UploadFile, user_id: int, lan: str) -> str:
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


def get_next_user_chat_id(db: Session, user_id: int) -> int:
    """Returns the next sequential user_chat_id for a given user."""
    last = (
        db.query(Chat)
        .filter(Chat.user_id == user_id)
        .order_by(Chat.user_chat_id.desc())
        .first()
    )
    return (last.user_chat_id + 1) if last else 1


def build_message_history(db: Session, chat_id: int, new_message: str) -> list[dict]:
    """
    Loads the last 20 messages for a chat and appends the new user message.
    Returns a list of {role, content} dicts ready for the LLM.
    """
    history = (
        db.query(ChatHistory)
        .filter(ChatHistory.chat_id == chat_id)
        .order_by(ChatHistory.timestamp.desc())
        .limit(20)
        .all()
    )
    messages = [{"role": h.role, "content": h.message} for h in reversed(history)]
    messages.append({"role": "user", "content": new_message})
    return messages
