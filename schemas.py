from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class UserCreate(BaseModel):
    username: str
    native_language: str = "de"


class UserResponse(BaseModel):
    id: int
    username: str
    native_language: str

    class Config:
        from_attributes = True


class LanguageLearningCreate(BaseModel):
    learning_language: str
    proficiency_level: str = "A0"


class LanguageLearningResponse(BaseModel):
    id: int
    user_id: int
    learning_language: str
    proficiency_level: str

    class Config:
        from_attributes = True


class MediaResponse(BaseModel):
    id: int
    title: str
    content_type: str
    learning_id: int

    class Config:
        from_attributes = True


class VocabularyProgressResponse(BaseModel):
    due: Optional[datetime] = None
    interval_days: int = 0
    ease_factor: float = 2.5
    repetitions: int = 0
    lapses: int = 0
    llm_mastery_score: float = 0.0

    class Config:
        from_attributes = True


class VocabularyResponse(BaseModel):
    id: int
    word: str
    translation: Optional[str] = None
    context_sentence: Optional[str] = None
    language: Optional[str] = None

    proficiency_level: Optional[str] = None
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class VocabularyCreate(BaseModel):
    word: str
    translation: Optional[str] = None
    context_sentence: Optional[str] = None


class VocabularyUpdate(BaseModel):
    word: Optional[str] = None
    translation: Optional[str] = None
    context_sentence: Optional[str] = None


class ChatCreate(BaseModel):
    media_id: int


class ChatResponse(BaseModel):
    id: int
    media_id: int
    user_id: int
    user_chat_id: int

    class Config:
        from_attributes = True


class ChatMessageRequest(BaseModel):
    message: str


class ChatMessageResponse(BaseModel):
    id: int
    role: str
    message: str
    timestamp: datetime

    class Config:
        from_attributes = True

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