import uuid
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, UniqueConstraint, Float, Integer, UUID
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from database import Base
from datetime import datetime, timezone


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    username = Column(String, unique=True, index=True)
    native_language = Column(String, default="de")
    hashed_password = Column(String, nullable=False)

    language_learnings = relationship("LanguageLearning", back_populates="user")
    chats = relationship("Chat", back_populates="user")


class LanguageLearning(Base):
    __tablename__ = "language_learning"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    learning_language = Column(String, nullable=False)
    proficiency_level = Column(String, default="A0")
    user_motivation = Column(String)

    user = relationship("User", back_populates="language_learnings")
    media = relationship("Media", back_populates="language_learning", cascade="all, delete-orphan")
    vocabularies = relationship("Vocabulary", back_populates="language_learning", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "learning_language"
        ),
    )


class Media(Base):
    __tablename__ = "media"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String, nullable=False)
    content_type = Column(String, nullable=False)  # srt, txt, pdf
    file_path = Column(String)
    extracted_content = Column(Text)
    learning_id = Column(UUID(as_uuid=True), ForeignKey("language_learning.id"), nullable=False)

    language_learning = relationship("LanguageLearning", back_populates="media")
    chats = relationship("Chat", back_populates="media", cascade="all, delete-orphan")
    media_vocabularies = relationship("MediaVocabulary", back_populates="media", cascade="all, delete-orphan")
    learning_progress = relationship("LearningProgress", back_populates="media")

    chunks_nomic = relationship("MediaChunkNomic", back_populates="media", cascade="all, delete-orphan")
    chunks_mxbai = relationship("MediaChunkMxbai", back_populates="media", cascade="all, delete-orphan")
    chunks_openai = relationship("MediaChunkOpenAI", back_populates="media", cascade="all, delete-orphan")
    chunks_google = relationship("MediaChunkGoogle", back_populates="media", cascade="all, delete-orphan")


class Vocabulary(Base):
    __tablename__ = "vocabularies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    learning_id = Column(UUID(as_uuid=True), ForeignKey("language_learning.id"), nullable=False)
    word = Column(String, nullable=False)
    translation = Column(String)
    context_sentence = Column(Text)
    language = Column(String)
    created_at = Column(DateTime)

    due = Column(DateTime)
    interval_days = Column(Integer, default=0)
    ease_factor = Column(Float, default=2.5)
    repetitions = Column(Integer, default=0)
    lapses = Column(Integer, default=0)

    llm_mastery_score = Column(Float, default=0.0)
    last_interaction = Column(DateTime)
    llm_context = Column(Text)

    language_learning = relationship("LanguageLearning", back_populates="vocabularies")
    media_vocabularies = relationship("MediaVocabulary", back_populates="vocabulary", cascade="all, delete-orphan")


class MediaVocabulary(Base):
    __tablename__ = "media_vocabularies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    media_id = Column(UUID(as_uuid=True), ForeignKey("media.id"), nullable=False)
    vocabulary_id = Column(UUID(as_uuid=True), ForeignKey("vocabularies.id"), nullable=False)

    media = relationship("Media", back_populates="media_vocabularies")
    vocabulary = relationship("Vocabulary", back_populates="media_vocabularies")


class Chat(Base):
    __tablename__ = "chats"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    media_id = Column(UUID(as_uuid=True), ForeignKey("media.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    media = relationship("Media", back_populates="chats")
    user = relationship("User", back_populates="chats")
    chat_histories = relationship("ChatHistory", back_populates="chat", cascade="all, delete-orphan")


class ChatHistory(Base):
    __tablename__ = "chat_histories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chats.id"), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    role = Column(String, nullable=False)  # "user" oder "assistant"

    chat = relationship("Chat", back_populates="chat_histories")


class LearningProgress(Base):
    __tablename__ = "learning_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    media_id = Column(UUID(as_uuid=True), ForeignKey("media.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    proficiency_level = Column(String)
    comment = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    media = relationship("Media", back_populates="learning_progress")


class MediaChunkNomic(Base):
    __tablename__ = "media_chunks_nomic"  # nomic-embed-text, 768 dims

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    media_id = Column(UUID(as_uuid=True), ForeignKey("media.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(768), nullable=True)

    media = relationship("Media", back_populates="chunks_nomic")


class MediaChunkMxbai(Base):
    __tablename__ = "media_chunks_mxbai"  # mxbai-embed-large, 1024 dims

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    media_id = Column(UUID(as_uuid=True), ForeignKey("media.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1024), nullable=True)

    media = relationship("Media", back_populates="chunks_mxbai")


class MediaChunkOpenAI(Base):
    __tablename__ = "media_chunks_openai"  # text-embedding-3-small, 1536 dims

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    media_id = Column(UUID(as_uuid=True), ForeignKey("media.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1536), nullable=True)

    media = relationship("Media", back_populates="chunks_openai")


class MediaChunkGoogle(Base):
    __tablename__ = "media_chunks_google"  # text-embedding-004, 768 dims

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    media_id = Column(UUID(as_uuid=True), ForeignKey("media.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(768), nullable=True)

    media = relationship("Media", back_populates="chunks_google")
