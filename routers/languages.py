from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
from models import LanguageLearning, Media, Chat
from schemas import (
    LanguageLearningResponse,
    ChatResponse,
    LanguageLearningCreate, LanguageLearningUpdate
)
from services.language_service import get_learning_or_404, create_learning_record

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


@router.post("", response_model=LanguageLearningResponse)
async def create_language(payload: LanguageLearningCreate, db: Session = Depends(get_db),
                          current_user=Depends(get_current_user)):
    learning = create_learning_record(db, payload.learning_language, current_user["id"], payload.proficiency_level,
                                      payload.user_motivation)
    return learning


@router.get("/{lan}", response_model=LanguageLearningResponse)
async def get_language(lan: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Returns language info"""
    learning = get_learning_or_404(db, lan, current_user["id"])
    return learning


@router.put("/{lan}", response_model=LanguageLearningResponse)
async def update_language(lan: str, payload: LanguageLearningUpdate, db: Session = Depends(get_db),
                          current_user=Depends(get_current_user)):
    learning = get_learning_or_404(db, lan, current_user["id"])
    if payload.proficiency_level is not None:
        learning.proficiency_level = payload.proficiency_level
    if payload.user_motivation is not None:
        learning.user_motivation = payload.user_motivation
    db.commit()
    db.refresh(learning)
    return learning


@router.delete("/{lan}")
async def delete_language(lan: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    learning = get_learning_or_404(db, lan, current_user["id"])
    db.delete(learning)
    db.commit()
    return {"status": f"Language learning profile {lan} deleted"}


@router.get("/{lan}/progress")
async def get_progress(lan: str):
    """Get learning progress"""
    # TODO
    return {
        "language": lan,
        "message": "progress"
    }
