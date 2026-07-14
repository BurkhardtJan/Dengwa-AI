from datetime import datetime, timedelta, timezone
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


def get_vocab_stats(
        db: Session,
        user_id: UUID,
        learning_id: UUID | None = None,
        media_id: UUID | None = None,
        template: str | None = None,
) -> dict:
    """Compute raw vocabulary progress numbers, optionally scoped to a
    language, a medium, and/or a card template."""
    now = datetime.now(timezone.utc)

    cards = scoped_card_query(db, user_id, learning_id, media_id, template).all()

    total = len(cards)
    mature = sum(1 for c in cards if c.interval_days >= 21)
    young = sum(1 for c in cards if 0 < c.interval_days < 21)
    new = sum(1 for c in cards if c.queue == "new")

    recent_logs_query = (
        db.query(ReviewLog)
        .join(VocabularyCard, ReviewLog.vocabulary_card_id == VocabularyCard.id)
        .join(Vocabulary, VocabularyCard.vocabulary_id == Vocabulary.id)
        .join(LanguageLearning, Vocabulary.learning_id == LanguageLearning.id)
        .filter(
            LanguageLearning.user_id == user_id,
            ReviewLog.reviewed_at >= now - timedelta(days=7),
        )
    )
    if learning_id:
        recent_logs_query = recent_logs_query.filter(Vocabulary.learning_id == learning_id)
    if media_id:
        recent_logs_query = recent_logs_query.join(
            MediaVocabulary, MediaVocabulary.vocabulary_id == Vocabulary.id
        ).filter(MediaVocabulary.media_id == media_id)
    if template:
        recent_logs_query = recent_logs_query.filter(VocabularyCard.template == template)

    recent_logs = recent_logs_query.all()
    retention = (
        sum(1 for log in recent_logs if log.ease >= 2) / len(recent_logs) * 100
        if recent_logs else None
    )

    return {
        "total_cards": total,
        "mature": mature,
        "young": young,
        "new": new,
        "retention_rate_7d": round(retention, 1) if retention is not None else None,
    }


def get_review_timeline(
        db: Session,
        user_id: UUID,
        learning_id: UUID | None = None,
        media_id: UUID | None = None,
        template: str | None = None,
        days: int = 30,
) -> list[dict]:
    """Return per-day review counts and retention rate for the last N days,
    optionally scoped to a language, a medium, and/or a card template."""
    since = datetime.now(timezone.utc) - timedelta(days=days)

    query = (
        db.query(ReviewLog)
        .join(VocabularyCard, ReviewLog.vocabulary_card_id == VocabularyCard.id)
        .join(Vocabulary, VocabularyCard.vocabulary_id == Vocabulary.id)
        .join(LanguageLearning, Vocabulary.learning_id == LanguageLearning.id)
        .filter(
            LanguageLearning.user_id == user_id,
            ReviewLog.reviewed_at >= since,
        )
    )
    if learning_id:
        query = query.filter(Vocabulary.learning_id == learning_id)
    if media_id:
        query = query.join(
            MediaVocabulary, MediaVocabulary.vocabulary_id == Vocabulary.id
        ).filter(MediaVocabulary.media_id == media_id)
    if template:
        query = query.filter(VocabularyCard.template == template)

    logs = query.order_by(ReviewLog.reviewed_at.asc()).all()

    # bucket by calendar day
    buckets: dict[str, list[ReviewLog]] = {}
    for log in logs:
        day_key = log.reviewed_at.date().isoformat()
        buckets.setdefault(day_key, []).append(log)

    timeline = []
    for day_key, day_logs in sorted(buckets.items()):
        total = len(day_logs)
        successful = sum(1 for log in day_logs if log.ease >= 2)
        again = sum(1 for log in day_logs if log.ease == 1)
        timeline.append({
            "date": day_key,
            "reviews": total,
            "successful": successful,
            "again": again,
            "retention_rate": round(successful / total * 100, 1),
        })

    return timeline
