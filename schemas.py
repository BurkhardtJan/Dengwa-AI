from pydantic import BaseModel
from typing import Optional, List


class VocabularyResponse(BaseModel):
    id: int
    word: str
    translation: Optional[str]
    context_sentence: Optional[str]
    status: int
    language: str