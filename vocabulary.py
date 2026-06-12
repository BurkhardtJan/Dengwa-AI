from datetime import datetime, timezone
from sqlalchemy import func
from sqlalchemy.orm import Session
from models import Vocabulary, MediaVocabulary, Media
from schemas import VocabularyExtraction
from prompts import build_vocab_extract_prompt
from llm_service import call_llm


def create_vocab(
        db: Session,
        learning_id: int,
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
        learning_id: int,
        word: str,
        translation: str | None = None,
        context_sentence: str | None = None,
        language: str | None = None,
) -> MediaVocabulary:
    """
    Creates media vocabulary and if necessary normal vocabulary.
    """

    vocab = get_or_create_vocab(
        db=db,
        learning_id=learning_id,
        word=word,
        translation=translation,
        context_sentence=context_sentence,
        language=language
    )

    existing_link = (
        db.query(MediaVocabulary)
        .filter(
            MediaVocabulary.media_id == media_id,
            MediaVocabulary.vocabulary_id == vocab.id
        )
        .first()
    )

    if existing_link:
        return existing_link

    media_vocab_link = MediaVocabulary(
        media_id=media_id,
        vocabulary_id=vocab.id
    )

    db.add(media_vocab_link)
    db.commit()
    db.refresh(media_vocab_link)

    return media_vocab_link


def extract_and_save_vocabulary(db: Session, media: Media, response_schema) -> VocabularyExtraction:
    """
    Calls the LLM to extract vocabulary from a media item and persists results to DB.
    Returns the structured LLM response.
    """
    system_prompt = build_vocab_extract_prompt(media)
    messages = [{"role": "user", "content": "Gib zwischen 10 Vokabeln zurück"}]

    response_structured = call_llm(
        messages=messages,
        system_prompt=system_prompt,
        provider="openai",
        temperature=0.2,
        response_schema=response_schema
    )

    for item in response_structured.vocabularies:
        create_media_vocab(
            db,
            media.id,
            media.learning_id,
            item.word,
            item.translation,
            item.context_sentence,
            media.language_learning.learning_language
        )

    return response_structured