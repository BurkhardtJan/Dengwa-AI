from fastapi import APIRouter, Depends
from typing import List, Optional
from sqlalchemy.orm import Session
from llm.prompts import build_system_prompt_language_chat
from services.system_services import get_current_user
from database import get_db
from models import Chat, ChatHistory, Media
from schemas import (
    ChatCreate, ChatResponse,
    ChatMessageRequest, ChatMessageResponse
)
from llm.client import call_llm
from services.chat_service import get_chat_or_404, get_next_user_chat_id, build_message_history
from services.media_service import get_media_or_404
from services.language_service import get_learning_or_404

router = APIRouter(prefix="/chats", tags=["Chats"])


@router.get("", response_model=List[ChatResponse])
async def get_chats(lan: Optional[str] = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get all chats for current user"""
    if lan:
        learning = get_learning_or_404(db, lan, current_user["id"])

        return (
            db.query(Chat)
            .join(Media, Chat.media_id == Media.id)
            .filter(Chat.user_id == current_user["id"], Media.learning_id == learning.id)
            .all()
        )
    else:
        return db.query(Chat).filter(Chat.user_id == current_user["id"]).all()


@router.post("", response_model=ChatCreate)
async def create_chat(
        media_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """Create a new chat for a medium"""
    get_media_or_404(db, media_id, current_user["id"])

    new_chat = Chat(
        media_id=media_id,
        user_id=current_user["id"],
        user_chat_id=get_next_user_chat_id(db, current_user["id"])
    )

    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)

    return new_chat


@router.get("/{chat_id}", response_model=List[ChatMessageResponse])
async def get_chat_history(
        chat_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """Get chat history"""
    chat = get_chat_or_404(db, chat_id, current_user["id"])

    return db.query(ChatHistory).filter(
        ChatHistory.chat_id == chat.id
    ).order_by(ChatHistory.timestamp).all()


@router.post("/{chat_id}", response_model=List[ChatMessageResponse])
async def post_chat_message(
        chat_id: int,
        request: ChatMessageRequest,
        provider: str | None = None,
        model: str | None = None,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """Send a message to the AI"""
    chat = get_chat_or_404(db, chat_id, current_user["id"])
    messages = build_message_history(db, chat.id, request.message)

    system_prompt = build_system_prompt_language_chat(chat)

    user_message = ChatHistory(chat_id=chat.id, role="user", message=request.message)
    db.add(user_message)

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


@router.delete("/{chat_id}")
async def delete_chat(chat_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    chat = get_chat_or_404(db, chat_id, current_user["id"])
    db.delete(chat)
    db.commit()
    return {"status": f"Chat {chat_id} deleted"}
