import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from typing import List, Optional
from sqlalchemy.orm import Session
from uuid import UUID
from services.user_service import get_current_user
from database import get_db
from models import Chat, ChatHistory, Media
from schemas import (
    ChatCreate, ChatResponse,
    ChatMessageRequest, ChatMessageResponse
)
from services.chat_service import get_chat_or_404, generate_assistant_reply, stream_assistant_reply, save_chat_message
from services.media_service import get_media_or_404
from services.language_service import get_learning_or_404


def sse(event: dict) -> str:
    return f"data: {json.dumps(event)}\n\n"


router = APIRouter(prefix="/chats", tags=["Chats"])


@router.get("", response_model=List[ChatResponse])
async def get_chats(lan: Optional[str] = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get all chats for current user"""
    if lan:
        learning = get_learning_or_404(db, lan, current_user.id)

        return (
            db.query(Chat)
            .join(Media, Chat.media_id == Media.id)
            .filter(Chat.user_id == current_user.id, Media.learning_id == learning.id)
            .all()
        )
    else:
        return db.query(Chat).filter(Chat.user_id == current_user.id).all()


@router.post("", response_model=ChatResponse)
async def create_chat(
        media_id: UUID,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """Create a new chat for a medium"""
    get_media_or_404(db, media_id, current_user.id)

    new_chat = Chat(
        media_id=media_id,
        user_id=current_user.id,
    )

    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)

    return new_chat


@router.get("/{chat_id}", response_model=List[ChatMessageResponse])
async def get_chat_history(
        chat_id: UUID,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """Get chat history"""
    chat = get_chat_or_404(db, chat_id, current_user.id)

    return db.query(ChatHistory).filter(
        ChatHistory.chat_id == chat.id
    ).order_by(ChatHistory.timestamp).all()


@router.post("/{chat_id}", response_model=List[ChatMessageResponse])
async def post_chat_message(
        chat_id: UUID,
        request: ChatMessageRequest,
        provider: str | None = None,
        model: str | None = None,
        embedding_model: str | None = None,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """Send a message to the AI"""
    chat = get_chat_or_404(db, chat_id, current_user.id)
    user_message = save_chat_message(db, chat.id, "user", request.message, request.parent_id)

    assistant_message = generate_assistant_reply(
        db, chat, user_message, provider, model, embedding_model
    )

    return [user_message, assistant_message]


@router.post("/{chat_id}/stream")
async def post_chat_message_stream(
        chat_id: UUID,
        request: ChatMessageRequest,
        provider: str | None = None,
        model: str | None = None,
        embedding_model: str | None = None,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """Send a message to the AI, streaming the assistant's reply token by token."""
    chat = get_chat_or_404(db, chat_id, current_user.id)
    user_message = save_chat_message(db, chat.id, "user", request.message, request.parent_id)

    def event_stream():
        yield sse({
            "type": "user_message",
            "message": ChatMessageResponse.model_validate(user_message).model_dump(mode="json"),
        })
        for kind, payload in stream_assistant_reply(db, chat, user_message, provider, model, embedding_model):
            if kind == "chunk":
                yield sse({"type": "chunk", "content": payload})
            else:
                yield sse({
                    "type": "done",
                    "message": ChatMessageResponse.model_validate(payload).model_dump(mode="json"),
                })

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/{chat_id}/messages/{user_message_id}", response_model=List[ChatMessageResponse])
async def create_response(
        chat_id: UUID,
        user_message_id: UUID,
        provider: str | None = None,
        model: str | None = None,
        embedding_model: str | None = None,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """
    Creates alternative answer to existing prompt.
    """
    chat = get_chat_or_404(db, chat_id, current_user.id)

    user_message = db.get(ChatHistory, user_message_id)
    if not user_message or user_message.chat_id != chat.id or user_message.role != "user":
        raise HTTPException(status_code=404, detail="User message not found")

    assistant_message = generate_assistant_reply(
        db, chat, user_message, provider, model, embedding_model
    )

    return [assistant_message]


@router.post("/{chat_id}/messages/{user_message_id}/stream")
async def create_response_stream(
        chat_id: UUID,
        user_message_id: UUID,
        provider: str | None = None,
        model: str | None = None,
        embedding_model: str | None = None,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """Creates a streamed alternative answer to an existing prompt."""
    chat = get_chat_or_404(db, chat_id, current_user.id)

    user_message = db.get(ChatHistory, user_message_id)
    if not user_message or user_message.chat_id != chat.id or user_message.role != "user":
        raise HTTPException(status_code=404, detail="User message not found")

    def event_stream():
        for kind, payload in stream_assistant_reply(db, chat, user_message, provider, model, embedding_model):
            if kind == "chunk":
                yield sse({"type": "chunk", "content": payload})
            else:
                yield sse({
                    "type": "done",
                    "message": ChatMessageResponse.model_validate(payload).model_dump(mode="json"),
                })

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.delete("/{chat_id}")
async def delete_chat(chat_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    chat = get_chat_or_404(db, chat_id, current_user.id)
    db.delete(chat)
    db.commit()
    return {"status": f"Chat {chat_id} deleted"}


@router.post("/{chat_id}/write", response_model=ChatMessageResponse)
async def write_chat_message(
        chat_id: UUID,
        request: ChatMessageRequest,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """
    Writes a finished message to the chat history.
    """
    chat = get_chat_or_404(db, chat_id, current_user.id)

    return save_chat_message(
        db, chat.id, request.role, request.message, request.parent_id
    )
