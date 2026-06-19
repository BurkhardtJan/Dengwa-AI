from fastapi import HTTPException
from sqlalchemy.orm import Session
from models import Chat, ChatHistory


def get_chat_or_404(db: Session, chat_id: int, user_id: int) -> Chat:
    """Returns a Chat by user_chat_id scoped to a user, or raises 404."""
    chat = db.query(Chat).filter(Chat.user_chat_id == chat_id, Chat.user_id == user_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


def get_next_user_chat_id(db: Session, user_id: int) -> int:
    """Returns the next sequential user_chat_id for a given user."""
    last = (
        db.query(Chat)
        .filter(Chat.user_id == user_id)
        .order_by(Chat.user_chat_id.desc())
        .first()
    )
    return (last.user_chat_id + 1) if last else 1


def build_message_history(db: Session, chat_id: int, new_message: str, limit: int = 20) -> list[dict]:
    """
    Loads the last {limit} messages for a chat and appends the new user message.
    Returns a list of {role, content} dicts ready for the LLM.
    """
    history = (
        db.query(ChatHistory)
        .filter(ChatHistory.chat_id == chat_id)
        .order_by(ChatHistory.timestamp.desc())
        .limit(limit)
        .all()
    )
    messages = [{"role": h.role, "content": h.message} for h in reversed(history)]
    messages.append({"role": "user", "content": new_message})
    return messages
