from fastapi import HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from models import Chat, ChatHistory
from llm.providers import resolve_chat_config, resolve_embedding_provider
from llm.prompts import build_system_prompt_language_chat
from llm.client import call_llm
from llm.rag_service import retrieve_context


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


def generate_assistant_reply(
        db: Session,
        chat: Chat,
        user_message: ChatHistory,
        provider: str | None,
        model: str | None,
        embedding_model: str | None,
) -> ChatHistory:
    """
    Common logic to generate the assistant reply.
    """
    resolved_provider, resolved_model = resolve_chat_config(provider, model)
    resolved_embedding = resolve_embedding_provider(embedding_model)

    messages = build_message_history(db, user_message.parent_id, user_message.message)
    rag_context = retrieve_context(db, chat.media_id, user_message.message, provider=resolved_embedding)
    system_prompt = build_system_prompt_language_chat(chat, rag_context)

    ai_response = call_llm(
        messages=messages,
        system_prompt=system_prompt,
        provider=resolved_provider,
        model=resolved_model,
    )

    return ChatHistory(
        chat_id=chat.id,
        role="assistant",
        message=ai_response,
        parent_id=user_message.id,
        provider=resolved_provider,
        model=resolved_model,
        embedding_model=resolved_embedding,
    )
