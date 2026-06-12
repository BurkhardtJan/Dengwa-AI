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


@router.post("/{media_id}/chats", response_model=ChatCreate)
async def create_chat(
        media_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """Create a new chat for a medium"""
    get_media_or_404(db, media_id)

    new_chat = Chat(
        media_id=media_id,
        user_id=current_user["id"],
        user_chat_id=get_next_user_chat_id(db, current_user["id"])
    )

    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)

    return new_chat


@router.post("/{media_id}/vocabulary")
async def extract_media_vocabulary(
        media_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """Extract vocabulary from a medium using LLM"""
    media = get_media_or_404(db, media_id)
    return extract_and_save_vocabulary(db, media, VocabularyExtraction)
