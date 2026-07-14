from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import case, func
from sqlalchemy.orm import Session, Query

from models import Vocabulary, VocabularyCard, LanguageLearning, MediaVocabulary, ReviewLog
from services.sm2 import sm2_review
from schemas import ReviewCardOut



def _to_review_card_out(card: VocabularyCard) -> ReviewCardOut:
    return ReviewCardOut(
        id=card.id,
        vocabulary_id=card.vocabulary_id,
        word=card.vocabulary.word,
        translation=card.vocabulary.translation,
        context_sentence=card.vocabulary.context_sentence,
        language=card.vocabulary.language,
        template=card.template,
        queue=card.queue,
        due=card.due,
        interval_days=card.interval_days,
        ease_factor=card.ease_factor,
        repetitions=card.repetitions,
        lapses=card.lapses,
    )


def scoped_card_query(
        db: Session,
        user_id: UUID,
        learning_id: UUID | None = None,
        media_id: UUID | None = None,
        template: str | None = None,
) -> Query:
    """Build a card query scoped to the user, optionally narrowed to a
    language, a medium, and/or a card template."""
    query = (
        db.query(VocabularyCard)
        .join(Vocabulary, VocabularyCard.vocabulary_id == Vocabulary.id)
        .join(LanguageLearning, Vocabulary.learning_id == LanguageLearning.id)
        .filter(LanguageLearning.user_id == user_id)
    )
    if learning_id:
        query = query.filter(Vocabulary.learning_id == learning_id)
    if media_id:
        query = query.join(MediaVocabulary, MediaVocabulary.vocabulary_id == Vocabulary.id)
        query = query.filter(MediaVocabulary.media_id == media_id)
    if template:
        query = query.filter(VocabularyCard.template == template)
    return query


def get_next_card(
        db: Session,
        user_id: UUID,
        learning_id: UUID | None = None,
        media_id: UUID | None = None,
        template: str | None = None,
) -> VocabularyCard | None:
    now = datetime.now(timezone.utc)
    queue_priority = case(
        (VocabularyCard.queue == "learning", 0),
        (VocabularyCard.queue == "review", 1),
        (VocabularyCard.queue == "new", 2),
        else_=3,
    )
    card = (
        scoped_card_query(db, user_id, learning_id, media_id, template)
        .filter(VocabularyCard.due <= now)
        .order_by(queue_priority, VocabularyCard.due.asc())
        .first()
    )
    return _to_review_card_out(card) if card else None


def get_queue_counts(
        db: Session,
        user_id: UUID,
        learning_id: UUID | None = None,
        media_id: UUID | None = None,
        template: str | None = None,
) -> dict[str, int]:
    now = datetime.now(timezone.utc)
    rows = (
        scoped_card_query(db, user_id, learning_id, media_id, template)
        .filter(VocabularyCard.due <= now)
        .with_entities(VocabularyCard.queue, func.count(VocabularyCard.id))
        .group_by(VocabularyCard.queue)
        .all()
    )
    counts = {"new": 0, "learning": 0, "review": 0}
    for queue, count in rows:
        counts[queue] = count
    counts["total"] = sum(counts.values())
    return counts


def review_card(db: Session, card_id: UUID, user_id: UUID, ease: int) -> VocabularyCard:
    """Apply an SM-2 review grade to a card and log the review."""
    card = (
        db.query(VocabularyCard)
        .join(Vocabulary, VocabularyCard.vocabulary_id == Vocabulary.id)
        .join(LanguageLearning, Vocabulary.learning_id == LanguageLearning.id)
        .filter(
            VocabularyCard.id == card_id,
            LanguageLearning.user_id == user_id,
        )
        .first()
    )
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    interval_before = card.interval_days

    result = sm2_review(
        ease=ease,
        interval_days=card.interval_days,
        ease_factor=card.ease_factor,
        repetitions=card.repetitions,
    )

    card.interval_days = result.interval_days
    card.ease_factor = result.ease_factor
    card.repetitions = result.repetitions
    card.due = result.due
    card.queue = result.queue
    if ease == 1:
        card.lapses += 1

    db.add(ReviewLog(
        vocabulary_card_id=card.id,
        reviewed_at=datetime.now(timezone.utc),
        ease=ease,
        interval_before=interval_before,
        interval_after=result.interval_days,
        ease_factor_after=result.ease_factor,
    ))

    db.commit()
    db.refresh(card)
    return _to_review_card_out(card)
