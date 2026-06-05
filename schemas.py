from pydantic import BaseModel
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


class VocabularyResponse(BaseModel):
    id: int
    word: str
    translation: Optional[str] = None
    context_sentence: Optional[str] = None
    status: int
    language: Optional[str] = None

    class Config:
        from_attributes = True


class VocabularyUpdate(BaseModel):
    status: int  # 0-10


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


class ProgressResponse(BaseModel):
    id: int
    media_id: int
    user_id: int
    proficiency_level: Optional[str] = None
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
