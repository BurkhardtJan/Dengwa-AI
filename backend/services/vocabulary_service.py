from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from uuid import UUID
from models import Vocabulary, MediaVocabulary, LanguageLearning


def get_vocab_or_404(db: Session, vocab_id: UUID, user_id: UUID, learning_id: UUID | None = None) -> Vocabulary:
    """Returns a Vocabulary record scoped to a learning entry, or raises 404."""
    query = (
        db.query(Vocabulary)
        .join(LanguageLearning, Vocabulary.learning_id == LanguageLearning.id)
        .filter(
            Vocabulary.id == vocab_id,
            LanguageLearning.user_id == user_id,
        )
    )
    if learning_id:
        query = query.filter(Vocabulary.learning_id == learning_id)

    vocab = query.first()
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    return vocab


def create_vocab(
        db: Session,
        learning_id: UUID,
        word: str,
        translation: str | None = None,
        context_sentence: str | None = None,
        language: str | None = None,
) -> Vocabulary:
    """Create a new vocabulary entry"""
    vocab = Vocabulary(
        learning_id=learning_id,
        word=word.strip(),
        translation=translation,
        context_sentence=context_sentence,
        language=language,
        created_at=datetime.now(timezone.utc),
        due=datetime.now(timezone.utc),
        interval_days=0,
        ease_factor=2.5,
        repetitions=0,
        lapses=0,
        llm_mastery_score=0.0,
        last_interaction=datetime.now(timezone.utc),
        llm_context=None,
    )

    db.add(vocab)
    db.commit()
    db.refresh(vocab)

    return vocab


def get_or_create_vocab(
        db: Session,
        learning_id: UUID,
        word: str,
        translation: str | None = None,
        context_sentence: str | None = None,
        language: str | None = None,
) -> Vocabulary:
    """
    Get existing vocabulary or create it.
    Matching is case-insensitive.
    """

    normalized_word = word.strip().lower()

    vocab = (
        db.query(Vocabulary)
        .filter(
            Vocabulary.learning_id == learning_id,
            func.lower(Vocabulary.word) == normalized_word,
        )
        .first()
    )

    if vocab:
        return vocab

    return create_vocab(
        db=db,
        learning_id=learning_id,
        word=word,
        translation=translation,
        context_sentence=context_sentence,
        language=language,
    )
