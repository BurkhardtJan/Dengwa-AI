import os
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from llm.providers import get_chat_model as get_model


def build_messages(
        history: list[dict],
        system_prompt: str | None = None,
) -> list[BaseMessage]:
    """
    Converts (list of {role, content} dicts) in LangChain Message-Objekts.
    """
    messages: list[BaseMessage] = []

    if system_prompt:
        messages.append(SystemMessage(content=system_prompt))

    for msg in history:
        if msg["role"] in ("user", "context"):
            messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] in ("assistant", "model"):
            messages.append(AIMessage(content=msg["content"]))

    return messages


def prepare_chat(
        messages: list[dict],
        system_prompt: str = "",
        provider: str | None = None,
        model: str | None = None,
        temperature: float = 1.0,
        max_tokens: int | None = None,
        streaming: bool = False,
):
    """
    Resolves the provider/model and builds LangChain messages.
    Returns the raw LangChain Runnable + messages — callers use
    .invoke(), .stream(), .with_structured_output(), .bind_tools()
    directly, whatever they need.
    """
    lc_model = get_model(provider=provider, model=model, temperature=temperature, max_tokens=max_tokens, streaming=streaming)
    lc_messages = build_messages(messages, system_prompt=system_prompt)
    return lc_model, lc_messages


def call_llm(
        messages: list[dict],
        system_prompt: str = "",
        provider: str | None = None,
        model: str | None = None,
        temperature: float = 1.0,
        max_tokens: int | None = None,
        response_schema: type[BaseModel] | None = None,
        tools: list | None = None,
) -> str | BaseModel:
    """
    Wrapper for LLM providers
    """
    lc_model, lc_messages = prepare_chat(messages, system_prompt, provider, model, temperature, max_tokens)

    # Structured Output
    if response_schema:
        return lc_model.with_structured_output(response_schema).invoke(lc_messages)

    # Tool-Calling
    if tools:
        return lc_model.bind_tools(tools).invoke(lc_messages)

    # Normal Call
    response = lc_model.invoke(lc_messages)
    return response.content
