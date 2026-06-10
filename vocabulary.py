from datetime import datetime, timezone
from sqlalchemy import func
from sqlalchemy.orm import Session
from models import Vocabulary, MediaVocabulary, VocabularyProgress


def create_vocab(
        db: Session,
        learning_id: int,
        word: str,
        translation: str | None = None,
        context_sentence: str | None = None,
        language: str | None = None,
) -> Vocabulary:
    """Create a new vocabulary entry and initialize vocabulary progress."""
    vocab = Vocabulary(
        learning_id=learning_id,
        word=word.strip(),
        translation=translation,
        context_sentence=context_sentence,
        language=language,
        created_at=datetime.now(timezone.utc),
    )

    db.add(vocab)
    db.flush()

    progress = VocabularyProgress(
        vocabulary_id=vocab.id,
        due=datetime.now(timezone.utc),
        interval_days=0,
        ease_factor=2.5,
        repetitions=0,
        lapses=0,
        llm_mastery_score=0.0,
        last_interaction=datetime.now(timezone.utc),
        llm_context=None,
    )

    db.add(progress)
    db.commit()
    db.refresh(vocab)

    return vocab


def get_or_create_vocab(
    db: Session,
    learning_id: int,
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


def create_media_vocab(
    db: Session,
    media_id: int,
    vocabulary_id: int,
) -> MediaVocabulary:
    """
    Create media <-> vocabulary mapping
    if it does not already exist.
    """

    existing_mapping = (
        db.query(MediaVocabulary)
        .filter(
            MediaVocabulary.media_id == media_id,
            MediaVocabulary.vocabulary_id == vocabulary_id,
        )
        .first()
    )

    if existing_mapping:
        return existing_mapping

    mapping = MediaVocabulary(
        media_id=media_id,
        vocabulary_id=vocabulary_id,
    )

    db.add(mapping)
    db.commit()
    db.refresh(mapping)

    return mapping