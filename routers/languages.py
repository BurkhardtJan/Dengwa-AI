from fastapi import APIRouter, FastAPI, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from vocabulary import create_vocab, get_or_create_vocab, create_media_vocab
from models import LanguageLearning
from dependencies import *
from schemas import (
    LanguageLearningResponse,
    MediaResponse,
    VocabularyResponse, VocabularyCreate, VocabularyUpdate,
    ChatCreate, ChatResponse,
    ChatMessageRequest, ChatMessageResponse,
    VocabularyExtraction
)

router = APIRouter(prefix="/languages", tags=["Languages"])


@router.get("", response_model=List[LanguageLearningResponse])
async def get_languages(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Returns list of languages for current user"""
    learning = (
        db.query(LanguageLearning)
        .filter(
            LanguageLearning.user_id == current_user["id"]
        )
    ).all()
    return learning


@router.get("/{lan}", response_model=LanguageLearningResponse)
async def get_language(lan: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Returns language info"""
    learning = get_learning_or_404(db, lan, current_user["id"])
    return learning


@router.get("/{lan}/media", response_model=List[MediaResponse])
async def get_media(lan: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Returns media list for language"""
    learning = get_learning_or_404(db, lan, current_user["id"])
    return db.query(Media).filter(Media.learning_id == learning.id).all()


@router.post("/{lan}/media", response_model=MediaResponse)
async def post_media(lan: str, title: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db),
                     current_user=Depends(get_current_user)):
    """Upload a Medium"""
    learning = get_or_create_learning(db, lan, current_user["id"])
    file_path = save_uploaded_file(file, current_user["id"], lan)
    return create_media_record(db, title, file, file_path, learning.id)


@router.get("/{lan}/chats", response_model=List[ChatResponse])
async def get_language_chats(lan: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get all chats for a language"""
    learning = get_learning_or_404(db, lan, current_user["id"])

    return (
        db.query(Chat)
        .join(Media, Chat.media_id == Media.id)
        .filter(Chat.user_id == current_user["id"], Media.learning_id == learning.id)
        .all()
    )


@router.get("/{lan}/progress")
async def get_progress(lan: str):
    """Get learning progress"""
    # TODO
    return {
        "language": lan,
        "message": "progress"
    }
