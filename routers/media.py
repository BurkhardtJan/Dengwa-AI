from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from typing import List
import uvicorn
import os
import shutil
from media_processing import extract_content
from llm_service import call_llm
from prompts import build_system_prompt_language_chat, build_vocab_extract_prompt
from vocabulary import create_vocab, get_or_create_vocab, create_media_vocab
from dependencies import *

from database import get_db, Base, engine
from models import LanguageLearning, Media, Vocabulary, MediaVocabulary, Chat, ChatHistory, LearningProgress, User
from schemas import (
    LanguageLearningResponse,
    MediaResponse,
    VocabularyResponse, VocabularyCreate, VocabularyUpdate,
    ChatCreate, ChatResponse,
    ChatMessageRequest, ChatMessageResponse,
    VocabularyExtraction
)

router = APIRouter(prefix="/media", tags=["Media"])


@router.get("", response_model=List[MediaResponse])
async def get_media(lan: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Returns media list for language"""
    learning = get_learning_or_404(db, lan, current_user["id"])
    return db.query(Media).filter(Media.learning_id == learning.id).all()


@router.post("", response_model=MediaResponse)
async def post_media(lan: str, title: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db),
                     current_user=Depends(get_current_user)):
    """Upload a Medium"""
    learning = get_or_create_learning(db, lan, current_user["id"])
    file_path = save_uploaded_file(file, current_user["id"], lan)
    return create_media_record(db, title, file, file_path, learning.id)


@router.post("/{media_id}/vocabulary")
async def extract_media_vocabulary(
        media_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """Extract vocabulary from a medium using LLM"""
    media = get_media_or_404(db, media_id)
    return extract_and_save_vocabulary(db, media, VocabularyExtraction)


@router.get("/{media_id}", response_model=MediaResponse)
async def get_single_medium(media_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    media = get_media_or_404(db, media_id)
    return media


@router.delete("/{media_id}")
async def delete_medium(media_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    media = get_media_or_404(db, media_id)
    db.delete(media)
    db.commit()
    return {"status": "Media deleted"}
