from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import uvicorn
import os

from database import get_db
from models import LanguageLearning, Media, Vocabulary, MediaVocabulary, Chat, ChatHistory, LearningProgress
from schemas import (
    MediaResponse,
    VocabularyResponse, VocabularyUpdate,
    ChatCreate, ChatResponse,
    ChatMessageRequest, ChatMessageResponse,
    ProgressResponse
)

app = FastAPI()


def get_current_user():
    return {"id": 1}


def get_learning_or_404(db: Session, lan: str, user_id: int):
    learning = (
        db.query(LanguageLearning)
        .filter(
            LanguageLearning.learning_language == lan,
            LanguageLearning.user_id == user_id
        )
        .first()
    )

    if not learning:
        raise HTTPException(
            status_code=404,
            detail="Language learning not found"
        )

    return learning


@app.get("/health")
async def root():
    return {"message": "Immersio AI running"}


@app.get("/languages/{lan}/media", response_model=List[MediaResponse])
async def get_media(lan: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    learning = get_learning_or_404(db, lan, current_user["id"])
    return db.query(Media).filter(Media.learning_id == learning.id).all()


@app.post("/languages/{lan}/media")
async def post_media(lan: str):
    return {
        "language": lan,
        "message": "media uploaded"
    }


@app.get("/languages/{lan}/vocabularies", response_model=List[VocabularyResponse])
async def get_vocabularies(lan: str, status: int | None = None, db: Session = Depends(get_db),
                           current_user=Depends(get_current_user)):
    learning = get_learning_or_404(db, lan, current_user["id"])

    query = db.query(Vocabulary).filter(Vocabulary.learning_id == learning.id)
    if status is not None:
        query = query.filter(Vocabulary.status == status)
    return query.all()


@app.get("/languages/{lan}/chats", response_model=List[ChatResponse])
async def get_chats(lan: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    learning = get_learning_or_404(db, lan, current_user["id"])
    return db.query(Chat).filter(Chat.learning_id == learning.user_id).all()


@app.get("/languages/{lan}/chats/{chat_id}", response_model=List[ChatMessageResponse])
async def get_chat_history(
        lan: str,
        chat_id: int,
        db: Session = Depends(get_db)
):
    chat = db.query(Chat).filter(Chat.user_chat_id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    return db.query(ChatHistory).filter(
        ChatHistory.chat_id == chat_id
    ).order_by(ChatHistory.timestamp).all()


@app.post("/languages/{lan}/chats/{chat_id}", response_model=List[ChatMessageResponse])
async def post_chat_message(
        lan: str,
        chat_id: int,
        request: ChatMessageRequest,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    learning = get_learning_or_404(db, lan, current_user["id"])
    chat = db.query(Chat).filter(Chat.user_chat_id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    user_message = ChatHistory(chat_id=chat.id, role="user", message=request.message)
    db.add(user_message)

    ai_response = (f"You asked about: {request.message}")

    assistant_message = ChatHistory(chat_id=chat.id, role="assistant", message=ai_response)
    db.add(assistant_message)
    db.commit()

    return [user_message, assistant_message]


@app.get("/languages/{lan}/progress")
async def get_progress(lan: str):
    return {
        "language": lan,
        "message": "progress"
    }


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
    )
