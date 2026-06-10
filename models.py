from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, UniqueConstraint, Float
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    native_language = Column(String, default="de")

    language_learnings = relationship("LanguageLearning", back_populates="user")
    chats = relationship("Chat", back_populates="user")


class LanguageLearning(Base):
    __tablename__ = "language_learning"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    learning_language = Column(String, nullable=False)
    proficiency_level = Column(String, default="A0")  # GER

    user = relationship("User", back_populates="language_learnings")
    media = relationship("Media", back_populates="language_learning")
    vocabularies = relationship("Vocabulary", back_populates="language_learning")

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "learning_language"
        ),
    )


class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content_type = Column(String, nullable=False)  # srt, txt, pdf
    file_path = Column(String)
    extracted_content = Column(Text)
    learning_id = Column(Integer, ForeignKey("language_learning.id"), nullable=False)

    language_learning = relationship("LanguageLearning", back_populates="media")
    chats = relationship("Chat", back_populates="media")
    media_vocabularies = relationship("MediaVocabulary", back_populates="media")
    learning_progress = relationship("LearningProgress", back_populates="media")


class Vocabulary(Base):
    __tablename__ = "vocabularies"

    id = Column(Integer, primary_key=True, index=True)
    learning_id = Column(Integer, ForeignKey("language_learning.id"), nullable=False)
    word = Column(String, nullable=False)
    translation = Column(String)
    context_sentence = Column(Text)
    language = Column(String)
    created_at = Column(DateTime)

    language_learning = relationship("LanguageLearning", back_populates="vocabularies")
    media_vocabularies = relationship("MediaVocabulary", back_populates="vocabulary")
    progress = relationship(
        "VocabularyProgress", back_populates="vocabulary", uselist=False)


class VocabularyProgress(Base):
    __tablename__ = "vocabulary_progress"

    id = Column(Integer, primary_key=True)
    vocabulary_id = Column(Integer, ForeignKey("vocabularies.id"), unique=True)
    due = Column(DateTime)
    interval_days = Column(Integer, default=0)
    ease_factor = Column(Float, default=2.5)
    repetitions = Column(Integer, default=0)
    lapses = Column(Integer, default=0)
    llm_mastery_score = Column(Float, default=0.0)
    last_interaction = Column(DateTime)
    llm_context = Column(Text)
    vocabulary = relationship("Vocabulary", back_populates="progress")


class MediaVocabulary(Base):
    __tablename__ = "media_vocabularies"

    id = Column(Integer, primary_key=True, index=True)
    media_id = Column(Integer, ForeignKey("media.id"), nullable=False)
    vocabulary_id = Column(Integer, ForeignKey("vocabularies.id"), nullable=False)

    media = relationship("Media", back_populates="media_vocabularies")
    vocabulary = relationship("Vocabulary", back_populates="media_vocabularies")


class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    media_id = Column(Integer, ForeignKey("media.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user_chat_id = Column(Integer, nullable=False)

    media = relationship("Media", back_populates="chats")
    user = relationship("User", back_populates="chats")
    chat_histories = relationship("ChatHistory", back_populates="chat")

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "user_chat_id"
        ),
    )


class ChatHistory(Base):
    __tablename__ = "chat_histories"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id"), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    role = Column(String, nullable=False)  # "user" oder "assistant"

    chat = relationship("Chat", back_populates="chat_histories")


class LearningProgress(Base):
    __tablename__ = "learning_progress"

    id = Column(Integer, primary_key=True, index=True)
    media_id = Column(Integer, ForeignKey("media.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    proficiency_level = Column(String)
    comment = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    media = relationship("Media", back_populates="learning_progress")
