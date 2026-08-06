from fastapi import HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from models import Chat, ChatHistory
from llm.providers import resolve_chat_config, resolve_embedding_key
from llm.prompts import build_system_prompt_language_chat, build_chat_title_prompt
from llm.client import call_llm, prepare_chat
from llm.rag_service import retrieve_context


def get_chat_or_404(db: Session, chat_id: UUID, user_id: UUID) -> Chat:
    """Returns a Chat by user_chat_id scoped to a user, or raises 404."""
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


def save_chat_message(
        db: Session,
        chat_id: UUID,
        role: str,
        message: str,
        parent_id: UUID | None,
        provider: str | None = None,
        model: str | None = None,
        embedding_model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
        input_tokens: int | None = None,
        output_tokens: int | None = None,
) -> ChatHistory:
    """
    Writes a single message to the chat history.
    """
    entry = ChatHistory(
        chat_id=chat_id,
        role=role,
        message=message,
        parent_id=parent_id,
        provider=provider,
        model=model,
        embedding_model=embedding_model,
        temperature=temperature,
        max_tokens=max_tokens,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


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
        temperature: float | None = None,
        max_tokens: int | None = None,
) -> ChatHistory:
    """
    Common logic to generate the assistant reply.
    """
    resolved_provider, resolved_model = resolve_chat_config(provider, model)
    resolved_embedding = resolve_embedding_key(embedding_model)

    messages = build_message_history(db, user_message.parent_id, user_message.message)
    rag_context = retrieve_context(db, chat.media_id, user_message.message, embedding_key=resolved_embedding)
    system_prompt = build_system_prompt_language_chat(chat, rag_context)

    # Use prepare_chat + invoke directly (instead of call_llm) so we get the
    # raw AIMessage back with .usage_metadata for token tracking - call_llm()
    # only returns the plain text content.
    lc_model, lc_messages = prepare_chat(
        messages=messages, system_prompt=system_prompt, provider=resolved_provider, model=resolved_model,
        temperature=temperature if temperature is not None else 1.0, max_tokens=max_tokens,
    )
    response = lc_model.invoke(lc_messages)
    usage = getattr(response, "usage_metadata", None) or {}

    return save_chat_message(
        db, chat.id, "assistant", response.content, user_message.id,
        provider=resolved_provider, model=resolved_model, embedding_model=resolved_embedding,
        temperature=temperature, max_tokens=max_tokens,
        input_tokens=usage.get("input_tokens"), output_tokens=usage.get("output_tokens"),
    )


def stream_assistant_reply(
        db: Session,
        chat: Chat,
        user_message: ChatHistory,
        provider: str | None,
        model: str | None,
        embedding_model: str | None,
        temperature: float | None = None,
        max_tokens: int | None = None,
):
    """
    Generator yielding ("chunk", str) per token, then ("done", ChatHistory).
    """
    resolved_provider, resolved_model = resolve_chat_config(provider, model)
    resolved_embedding = resolve_embedding_key(embedding_model)

    messages = build_message_history(db, user_message.parent_id, user_message.message)
    rag_context = retrieve_context(db, chat.media_id, user_message.message, embedding_key=resolved_embedding)
    system_prompt = build_system_prompt_language_chat(chat, rag_context)

    lc_model, lc_messages = prepare_chat(
        messages=messages, system_prompt=system_prompt, provider=resolved_provider, model=resolved_model,
        temperature=temperature if temperature is not None else 1.0, max_tokens=max_tokens, streaming=True,
    )

    full_text = ""
    # Accumulate chunks with "+" instead of just concatenating .content: LangChain's
    # AIMessageChunk.__add__ also merges usage_metadata, so the final accumulated
    # chunk carries the total token usage (if the provider reports it while streaming).
    accumulated = None
    for chunk in lc_model.stream(lc_messages):
        if chunk.content:
            full_text += chunk.content
            yield "chunk", chunk.content
        accumulated = chunk if accumulated is None else accumulated + chunk

    usage = getattr(accumulated, "usage_metadata", None) or {}

    assistant_message = save_chat_message(
        db, chat.id, "assistant", full_text, user_message.id,
        provider=resolved_provider, model=resolved_model, embedding_model=resolved_embedding,
        temperature=temperature, max_tokens=max_tokens,
        input_tokens=usage.get("input_tokens"), output_tokens=usage.get("output_tokens"),
    )
    yield "done", assistant_message


def generate_chat_title(
        db: Session,
        chat_id: UUID,
        first_message: str,
        provider: str | None = None,
        model: str | None = None,
) -> None:
    """
    Generates a short, descriptive chat title from the first user message,
    with the medium's title/summary as context so short opening messages
    (e.g. "Hallo!") still produce a meaningful title.
    """
    chat = db.get(Chat, chat_id)
    if not chat:
        return

    media = chat.media
    context_lines = [f"Medium: {media.title}"]
    if media.summary:
        context_lines.append(f"Zusammenfassung des Mediums: {media.summary}")
    context_lines.append(f"Erste Nachricht des Users: {first_message}")

    title = call_llm(
        messages=[{"role": "user", "content": "\n".join(context_lines)}],
        system_prompt=build_chat_title_prompt(),
        provider=provider,
        model=model,
        temperature=0.3,
    )

    chat.title = title.strip()
    db.commit()
