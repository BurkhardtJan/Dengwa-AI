from fastapi import HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from models import Chat, ChatHistory


def get_chat_or_404(db: Session, chat_id: UUID, user_id: UUID) -> Chat:
    """Returns a Chat by user_chat_id scoped to a user, or raises 404."""
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


def build_message_history(db: Session, parent_id: UUID | None, new_message: str, limit: int = 20) -> list[dict]:
    """
    Loads the last {limit} messages for a chat and appends the new user message.
    Wanders the message tree downwards.
    Returns a list of {role, content} dicts ready for the LLM.
    """
    history = []
    current_id = parent_id
    while current_id and len(history) < limit:
        node = db.query(ChatHistory).filter(ChatHistory.id == current_id).first()
        if not node:
            break
        history.append(node)
        current_id = node.parent_id
    messages = [{"role": h.role, "content": h.message} for h in reversed(history)]
    messages.append({"role": "user", "content": new_message})
    return messages
