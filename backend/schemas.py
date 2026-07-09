from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class UserRegister(BaseModel):
    username: str
    password: str
    native_language: str = "de"


class UserResponse(BaseModel):
    id: UUID
    username: str
    native_language: str

    model_config = ConfigDict(from_attributes=True)


class LanguageLearningCreate(BaseModel):
    learning_language: str
    proficiency_level: str = "A0"
    user_motivation: Optional[str] = None


class LanguageLearningUpdate(BaseModel):
    proficiency_level: Optional[str]
    user_motivation: Optional[str]


class LanguageLearningResponse(BaseModel):
    id: UUID
    user_id: UUID
    learning_language: str
    proficiency_level: str
    user_motivation: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class MediaResponse(BaseModel):
    id: UUID
    title: str
    content_type: str
    learning_id: UUID

    model_config = ConfigDict(from_attributes=True)


class VocabularyCardResponse(BaseModel):
    id: UUID
    template: Optional[str] = None
    queue: str = "new"
    due: Optional[datetime] = None
    interval_days: int = 0
    ease_factor: float = 2.5
    repetitions: int = 0
    lapses: int = 0

    model_config = ConfigDict(from_attributes=True)


class VocabularyResponse(BaseModel):
    id: UUID
    word: str
    translation: Optional[str] = None
    context_sentence: Optional[str] = None
    language: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VocabularyCreate(BaseModel):
    word: str
    translation: Optional[str] = None
    context_sentence: Optional[str] = None


class VocabularyUpdate(BaseModel):
    word: Optional[str] = None
    translation: Optional[str] = None
    context_sentence: Optional[str] = None


class ChatCreate(BaseModel):
    media_id: UUID


class ChatResponse(BaseModel):
    id: UUID
    media_id: UUID
    user_id: UUID

    model_config = ConfigDict(from_attributes=True)


class ChatMessageRequest(BaseModel):
    message: str
    parent_id: Optional[UUID] = None


class ChatMessageResponse(BaseModel):
    id: UUID
    role: str
    message: str
    timestamp: datetime
    parent_id: Optional[UUID] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    embedding_model: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ExtractedVocabularyItem(BaseModel):
    word: str = Field(
        description="Das fremdsprachige Wort in Originalschrift (z.B. Kanji/Kana bei Japanisch) und optionaler Romaji-Lautschrift in Klammern."
    )
    translation: str = Field(
        description="Die präzise deutsche Übersetzung des Wortes, passend zum Kontext des Textes."
    )
    context_sentence: str = Field(
        description="Der exakte Satz aus dem bereitgestellten Text, in dem das Wort vorkommt, um den Kontext zu wahren."
    )


class VocabularyExtraction(BaseModel):
    vocabularies: List[ExtractedVocabularyItem] = Field(
        description="Eine Liste aller aus dem Text extrahierten Schlüsselvokabeln."
    )


class ProviderModelsResponse(BaseModel):
    """Provider -> Liste of available models."""
    providers: dict[str, list[str]]

class EmbeddingModelsResponse(BaseModel):
    """List of curated Embedding-Provider-Keys."""
    models: list[str]