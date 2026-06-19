import os
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_ollama import ChatOllama
from dotenv import load_dotenv

load_dotenv()

DEFAULT_PROVIDER = os.environ.get("LLM_PROVIDER", "groq")
DEFAULT_MODELS = {
    "openai": "gpt-5-nano",
    "groq": "llama-3.3-70b-versatile",
    "gemini": "gemini-2.5-flash-lite",
    "ollama": "dolphin-llama3:latest",
}


def get_model(
        provider: str | None = None,
        model: str | None = None,
        temperature: float = 1.0,
        max_tokens: int | None = None,
        streaming: bool = False,
):
    """
    Returns LangChain Chat-Model.
    Provider: openai | groq | gemini | ollama
    """
    provider = provider or DEFAULT_PROVIDER
    model = model or DEFAULT_MODELS.get(provider)

    kwargs = {
        "model": model,
        "temperature": temperature,
        "streaming": streaming,
    }

    if max_tokens is not None:
        kwargs["max_tokens"] = max_tokens

    if provider == "openai":
        return ChatOpenAI(**kwargs)
    elif provider == "groq":
        return ChatGroq(**kwargs)
    elif provider == "gemini":
        return ChatGoogleGenerativeAI(**kwargs)
    elif provider == "ollama":
        return ChatOllama(
            model=model,
            temperature=temperature,
            num_predict=max_tokens,
            base_url=os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434"),
        )
    else:
        raise ValueError(f"Unknown provider '{provider}'. Available: openai, groq, gemini, ollama")


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
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] in ("assistant", "model"):
            messages.append(AIMessage(content=msg["content"]))

    return messages


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
    lc_model = get_model(
        provider=provider,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
    )

    lc_messages = build_messages(messages, system_prompt=system_prompt)

    # Structured Output
    if response_schema:
        return lc_model.with_structured_output(response_schema).invoke(lc_messages)

    # Tool-Calling
    if tools:
        return lc_model.bind_tools(tools).invoke(lc_messages)

    # Normal Call
    response = lc_model.invoke(lc_messages)
    return response.content
