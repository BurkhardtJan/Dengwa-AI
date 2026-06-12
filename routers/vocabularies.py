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

router = APIRouter(prefix="/languages/{lan}/vocabularies", tags=["Vocabularies"])


@router.get("", response_model=List[VocabularyResponse])
async def get_vocabularies(lan: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get vocabulary list"""
    learning = get_learning_or_404(db, lan, current_user["id"])
    query = db.query(Vocabulary).filter(Vocabulary.learning_id == learning.id)
    return query.all()


@router.post("", response_model=VocabularyResponse)
async def create_vocabulary_endpoint(lan: str, payload: VocabularyCreate, db: Session = Depends(get_db),
                                     current_user=Depends(get_current_user)):
    """Post new vocabulary"""
    learning = get_or_create_learning(db, lan, current_user["id"])
    vocab = get_or_create_vocab(db=db, learning_id=learning.id, word=payload.word, translation=payload.translation,
                                context_sentence=payload.context_sentence, language=lan)
    return vocab


@router.get("/{vocab_id}", response_model=VocabularyResponse)
async def get_vocabulary(lan: str, vocab_id: int, db: Session = Depends(get_db),
                         current_user=Depends(get_current_user)):
    """Get vocabulary by ID"""
    learning = get_learning_or_404(db, lan, current_user["id"])
    return get_vocab_or_404(db, vocab_id, learning.id)


@router.put("/{vocab_id}", response_model=VocabularyResponse)
async def update_vocabulary(lan: str, vocab_id: int, payload: VocabularyUpdate, db: Session = Depends(get_db),
                            current_user=Depends(get_current_user)):
    """Update Vocabulary by ID"""
    learning = get_learning_or_404(db, lan, current_user["id"])
    vocab = get_vocab_or_404(db, vocab_id, learning.id)

    if payload.word is not None:
        vocab.word = payload.word

    if payload.translation is not None:
        vocab.translation = payload.translation

    if payload.context_sentence is not None:
        vocab.context_sentence = payload.context_sentence

    db.commit()
    db.refresh(vocab)

    return vocab


@router.delete("/{vocab_id}")
async def delete_vocabulary(lan: str, vocab_id: int, db: Session = Depends(get_db),
                            current_user=Depends(get_current_user)):
    """Delete Vocabulary by id"""
    learning = get_learning_or_404(db, lan, current_user["id"])
    vocab = get_vocab_or_404(db, vocab_id, learning.id)
    db.delete(vocab)
    db.commit()

    return {"status": "deleted"}
