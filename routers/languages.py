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


@router.get("/{lan}/vocabularies", response_model=List[VocabularyResponse])
async def get_vocabularies(lan: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get vocabulary list"""
    learning = get_learning_or_404(db, lan, current_user["id"])
    query = db.query(Vocabulary).filter(Vocabulary.learning_id == learning.id)
    return query.all()


@router.post("/{lan}/vocabularies", response_model=VocabularyResponse)
async def create_vocabulary_endpoint(lan: str, payload: VocabularyCreate, db: Session = Depends(get_db),
                                     current_user=Depends(get_current_user)):
    """Post new vocabulary"""
    learning = get_or_create_learning(db, lan, current_user["id"])
    vocab = get_or_create_vocab(db=db, learning_id=learning.id, word=payload.word, translation=payload.translation,
                                context_sentence=payload.context_sentence, language=lan)
    return vocab


@router.get("/{lan}/vocabularies/{vocab_id}", response_model=VocabularyResponse)
async def get_vocabulary(lan: str, vocab_id: int, db: Session = Depends(get_db),
                         current_user=Depends(get_current_user)):
    """Get vocabulary by ID"""
    learning = get_learning_or_404(db, lan, current_user["id"])
    return get_vocab_or_404(db, vocab_id, learning.id)


@router.put("/{lan}/vocabularies/{vocab_id}", response_model=VocabularyResponse)
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


@router.delete("/{lan}/vocabularies/{vocab_id}")
async def delete_vocabulary(lan: str, vocab_id: int, db: Session = Depends(get_db),
                            current_user=Depends(get_current_user)):
    """Delete Vocabulary by id"""
    learning = get_learning_or_404(db, lan, current_user["id"])
    vocab = get_vocab_or_404(db, vocab_id, learning.id)
    db.delete(vocab)
    db.commit()

    return {"status": "deleted"}


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
