from fastapi import HTTPException
from sqlalchemy.orm import Session
from models import LanguageLearning


def get_learning_or_404(db: Session, lan: str, user_id: int) -> LanguageLearning:
    """Returns a LanguageLearning record or raises 404."""
    learning = (
        db.query(LanguageLearning)
        .filter(
            LanguageLearning.learning_language == lan,
            LanguageLearning.user_id == user_id,
        )
        .first()
    )
    if not learning:
        raise HTTPException(status_code=404, detail="Language learning not found")
    return learning


def get_or_create_learning(db: Session, lan: str, user_id: int) -> LanguageLearning:
    """Returns an existing LanguageLearning or creates a new one."""
    learning = (
        db.query(LanguageLearning)
        .filter(
            LanguageLearning.learning_language == lan,
            LanguageLearning.user_id == user_id,
        )
        .first()
    )
    if not learning:
        learning = create_learning_record(db, lan, user_id)
    return learning


def create_learning_record(
        db: Session,
        lan: str,
        user_id: int,
        proficiency_level: str = "A0",
        user_motivation: str | None = None,
) -> LanguageLearning:
    """Creates learning record in database."""
    learning = LanguageLearning(
        user_id=user_id,
        learning_language=lan,
        proficiency_level=proficiency_level,
        user_motivation=user_motivation,
    )
    db.add(learning)
    db.commit()
    db.refresh(learning)
    return learning
