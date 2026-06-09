from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import uvicorn
import os
import shutil
from media_processing import extract_content
from llm_service import call_llm
from prompts import build_system_prompt_language_chat

from database import get_db
from models import LanguageLearning, Media, Vocabulary, MediaVocabulary, Chat, ChatHistory, LearningProgress
from schemas import (
    MediaResponse,
    VocabularyResponse,
    ChatCreate, ChatResponse,
    ChatMessageRequest, ChatMessageResponse,
    ProgressResponse
)

app = FastAPI()


def get_current_user():
    """Gets id of current user by Auth"""
    # TODO: AUTH
    return {"id": 1}


def get_learning_or_404(db: Session, lan: str, user_id: int):
    """Gets learning info by user and language. Creates 404 if not found."""
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


def get_or_create_learning(db: Session, lan: str, user_id: int) -> LanguageLearning:
    """Gets learning info by user and language. Creates new learning id if not found."""
    learning = (
        db.query(LanguageLearning)
        .filter(
            LanguageLearning.learning_language == lan,
            LanguageLearning.user_id == user_id
        )
        .first()
    )

    if not learning:
        learning = LanguageLearning(
            user_id=user_id,
            learning_language=lan,
            proficiency_level="A0"
        )
        db.add(learning)
        db.commit()
        db.refresh(learning)

    return learning


@app.get("/health")
async def root():
    """Health check of the Website"""
    return {"message": "Immersio AI running"}


@app.get("/languages/{lan}/media", response_model=List[MediaResponse])
async def get_media(lan: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    learning = get_learning_or_404(db, lan, current_user["id"])
    return db.query(Media).filter(Media.learning_id == learning.id).all()


@app.post("/languages/{lan}/media", response_model=MediaResponse)
async def post_media(
        lan: str,
        title: str = Form(...),
        file: UploadFile = File(...),
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """Upload a Medium"""
    learning = get_or_create_learning(db, lan, current_user["id"])
    user_lan_dir = os.path.join("uploads", str(current_user["id"]), lan)
    os.makedirs(user_lan_dir, exist_ok=True)

    file_path = os.path.join(user_lan_dir, file.filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Speichern der Datei: {str(e)}")
    finally:
        await file.close()  #

    media = Media(
        title=title,
        content_type=file.content_type,
        file_path=file_path,
        extracted_content=extract_content(file.content_type, file_path),
        learning_id=learning.id
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    return media


@app.get("/languages/{lan}/vocabularies", response_model=List[VocabularyResponse])
async def get_vocabularies(lan: str, status: int | None = None, db: Session = Depends(get_db),
                           current_user=Depends(get_current_user)):
    """Get vocabulary list"""
    learning = get_learning_or_404(db, lan, current_user["id"])

    query = db.query(Vocabulary).filter(Vocabulary.learning_id == learning.id)
    if status is not None:
        query = query.filter(Vocabulary.status == status)
    return query.all()


@app.get("/languages/{lan}/chats", response_model=List[ChatResponse])
async def get_language_chats(lan: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get all chats for a language"""
    learning = get_learning_or_404(db, lan, current_user["id"])

    return (
        db.query(Chat)
        .join(Media, Chat.media_id == Media.id)
        .filter(Chat.user_id == current_user["id"], Media.learning_id == learning.id)
        .all()
    )


@app.get("/chats", response_model=List[ChatResponse])
async def get_chats(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get all chats for current user"""
    return db.query(Chat).filter(Chat.user_id == current_user["id"]).all()


@app.get("/chats/{chat_id}", response_model=List[ChatMessageResponse])
async def get_chat_history(
        chat_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """Get chat history"""
    chat = db.query(Chat).filter(Chat.user_chat_id == chat_id, Chat.user_id == current_user["id"]).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    return db.query(ChatHistory).filter(
        ChatHistory.chat_id == chat.id
    ).order_by(ChatHistory.timestamp).all()


@app.post("/media/{media_id}/chats", response_model=ChatCreate)
async def create_chat(
        media_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """Create a new chat for a medium"""
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(
            status_code=404,
            detail="Medium nicht gefunden oder Zugriff verweigert."
        )

    last_chat_id = db.query(Chat).filter(Chat.user_id == current_user["id"]).order_by(Chat.user_chat_id.desc()).first()
    user_chat_id = (last_chat_id.user_chat_id + 1) if last_chat_id else 1

    new_chat = Chat(
        media_id=media_id,
        user_id=current_user["id"],
        user_chat_id=user_chat_id
    )

    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)

    return new_chat


@app.post("/chats/{chat_id}", response_model=List[ChatMessageResponse])
async def post_chat_message(
        chat_id: int,
        request: ChatMessageRequest,
        provider: str | None = None,
        model: str | None = None,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """Send a message to the AI"""
    chat = db.query(Chat).filter(Chat.user_chat_id == chat_id, Chat.user_id == current_user["id"]).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    history = (
        db.query(ChatHistory)
        .filter(ChatHistory.chat_id == chat.id)
        .order_by(ChatHistory.timestamp.desc())
        .limit(20)
        .all()
    )
    messages = [{"role": h.role, "content": h.message} for h in reversed(history)]
    messages.append({"role": "user", "content": request.message})

    system_prompt = build_system_prompt_language_chat(chat)

    user_message = ChatHistory(chat_id=chat.id, role="user", message=request.message)
    db.add(user_message)

    ai_response = (f"You asked about: {request.message}")
    ai_response = call_llm(
        messages=messages,
        system_prompt=system_prompt,
        provider=provider,
        model=model,
    )

    assistant_message = ChatHistory(chat_id=chat.id, role="assistant", message=ai_response)
    db.add(assistant_message)
    db.commit()

    return [user_message, assistant_message]


@app.get("/languages/{lan}/progress")
async def get_progress(lan: str):
    """Get learning progress"""
    # TODO
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
