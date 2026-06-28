import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_ollama import ChatOllama

load_dotenv()

DEFAULT_CHAT_PROVIDER = os.environ.get("LLM_PROVIDER", "openai")
DEFAULT_EMBEDDING_PROVIDER = os.environ.get("EMBEDDING_PROVIDER", "openai")

# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------


CHAT_MODELS = {
    "openai": "gpt-4o-mini",
    "groq": "llama-3.3-70b-versatile",
    "gemini": "gemini-2.5-flash-lite",
    "ollama": "dolphin-llama3:latest",
}


def get_chat_model(
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

    provider = provider or DEFAULT_CHAT_PROVIDER
    model = model or CHAT_MODELS.get(provider)

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
        raise ValueError(
            f"Unknown chat provider '{provider}'. Available: openai, groq, gemini, ollama"
        )


# ---------------------------------------------------------------------------
# Embeddings
# ---------------------------------------------------------------------------


EMBEDDING_MODELS = {
    "nomic": "nomic-embed-text",  # Ollama, 768 dim
    "mxbai": "mxbai-embed-large",  # Ollama, 1024 dim
    "openai": "text-embedding-3-small",  # OpenAI, 1536 dim
    "google": "text-embedding-004",  # Google, 768 dim
}

EMBEDDING_DIMS = {
    "nomic": 768,
    "mxbai": 1024,
    "openai": 1536,
    "google": 768,
}

EMBEDDING_TABLES = {
    "nomic": "media_chunks_nomic",
    "mxbai": "media_chunks_mxbai",
    "openai": "media_chunks_openai",
    "google": "media_chunks_google",
}


def get_embedding_model(provider: str | None = None):
    """
    Returns LangChain Embeddings object.

    Provider: nomic | mxbai | openai | google

      nomic  → nomic-embed-text       (768 dim,  Ollama, lokal)
      mxbai  → mxbai-embed-large      (1024 dim, Ollama, lokal)
      openai → text-embedding-3-small (1536 dim, OpenAI API)
      google → text-embedding-004     (768 dim,  Google API)
    """
    from langchain_ollama import OllamaEmbeddings
    from langchain_openai import OpenAIEmbeddings
    from langchain_google_genai import GoogleGenerativeAIEmbeddings

    provider = provider or DEFAULT_EMBEDDING_PROVIDER

    if provider in ("nomic", "mxbai"):
        return OllamaEmbeddings(
            model=EMBEDDING_MODELS[provider],
            base_url=os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434"),
        )
    elif provider == "openai":
        return OpenAIEmbeddings(model=EMBEDDING_MODELS["openai"])
    elif provider == "google":
        return GoogleGenerativeAIEmbeddings(model=EMBEDDING_MODELS["google"])
    else:
        raise ValueError(
            f"Unknown embedding provider '{provider}'. Available: nomic, mxbai, openai, google"
        )


def get_embedding_dim(provider: str | None = None) -> int:
    """Returns the vector dimension for the given provider."""
    provider = provider or DEFAULT_EMBEDDING_PROVIDER
    return EMBEDDING_DIMS[provider]


def get_embedding_table(provider: str | None = None) -> str:
    provider = provider or DEFAULT_EMBEDDING_PROVIDER
    return EMBEDDING_TABLES[provider]
