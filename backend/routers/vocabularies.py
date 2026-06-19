from fastapi import APIRouter, Depends
from typing import List, Optional
from sqlalchemy.orm import Session
from database import get_db
from services.user_service import get_current_user
from models import Vocabulary, LanguageLearning
from schemas import (
    VocabularyResponse, VocabularyCreate, VocabularyUpdate
)
from services.vocabulary_service import get_vocab_or_404, get_or_create_vocab
from services.language_service import get_learning_or_404, get_or_create_learning

router = APIRouter(prefix="/vocabularies", tags=["Vocabularies"])


@router.get("", response_model=List[VocabularyResponse])
async def get_vocabularies(lan: Optional[str] = None, db: Session = Depends(get_db),
                           current_user=Depends(get_current_user)):
    """Get vocabulary list"""
    if lan:
        learning = get_learning_or_404(db, lan, current_user.id)
        query = db.query(Vocabulary).filter(Vocabulary.learning_id == learning.id)
        return query.all()
    else:
        query = db.query(Vocabulary).join(LanguageLearning, Vocabulary.learning_id == LanguageLearning.id).filter(
            LanguageLearning.user_id == current_user.id)
        return query.all()


@router.post("", response_model=VocabularyResponse)
async def create_vocabulary_endpoint(lan: str, payload: VocabularyCreate, db: Session = Depends(get_db),
                                     current_user=Depends(get_current_user)):
    """Post new vocabulary"""
    learning = get_or_create_learning(db, lan, current_user.id)
    vocab = get_or_create_vocab(db=db, learning_id=learning.id, word=payload.word, translation=payload.translation,
                                context_sentence=payload.context_sentence, language=lan)
    return vocab


@router.get("/{vocab_id}", response_model=VocabularyResponse)
async def get_vocabulary(vocab_id: int, db: Session = Depends(get_db),
                         current_user=Depends(get_current_user)):
    """Get vocabulary by ID"""
    return get_vocab_or_404(db, vocab_id, current_user.id)


@router.put("/{vocab_id}", response_model=VocabularyResponse)
async def update_vocabulary(vocab_id: int, payload: VocabularyUpdate, db: Session = Depends(get_db),
                            current_user=Depends(get_current_user)):
    """Update Vocabulary by ID"""
    vocab = get_vocab_or_404(db, vocab_id, current_user.id)

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
async def delete_vocabulary(vocab_id: int, db: Session = Depends(get_db),
                            current_user=Depends(get_current_user)):
    """Delete Vocabulary by id"""
    vocab = get_vocab_or_404(db, vocab_id, current_user.id)
    db.delete(vocab)
    db.commit()

    return {"status": "deleted"}
