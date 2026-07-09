import os
import httpx
from dotenv import load_dotenv
from google import genai
from groq import Groq
from openai import OpenAI
from llm.providers import EMBEDDING_CONFIGS

load_dotenv()

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")


def list_ollama_models() -> list[str]:
    """Fetches all locally pulled models from Ollama (contains both chat and embedding models)."""
    response = httpx.get(f"{OLLAMA_BASE_URL}/api/tags")
    response.raise_for_status()
    return [model["name"] for model in response.json()["models"]]


def list_openai_models(filter_fn) -> list[str]:
    """Fetches OpenAI models and filters them using the provided filter function."""
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    models = client.models.list()
    return sorted(m.id for m in models.data if filter_fn(m.id))


def list_groq_models() -> list[str]:
    """Fetches available chat models from Groq."""
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    models = client.models.list()
    # Exclude whisper audio models from chat models
    return sorted(m.id for m in models.data if "whisper" not in m.id)


def list_gemini_models(action: str) -> list[str]:
    """Fetches Gemini models filtered by supported action ('generateContent' or 'embedContent')."""
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    models = client.models.list()

    # Filter out internal/experimental names like 'lyria', 'nano-banana' for a cleaner list
    excluded_keywords = ["lyria", "banana", "robotics", "antigravity", "clip"]

    resolved_models = []
    for m in models:
        name = m.name.replace("models/", "")
        if action in m.supported_actions and not any(k in name for k in excluded_keywords):
            resolved_models.append(name)

    return sorted(resolved_models)


# ---------------------------------------------------------------------------
# Public Functions
# ---------------------------------------------------------------------------

def list_available_chat_models() -> dict[str, list[str]]:
    """
    Queries all configured chat providers for their available models.
    Failing providers (due to missing keys or network issues) return an empty list.
    """
    result: dict[str, list[str]] = {}

    openai_chat_filter = lambda mid: any(prefix in mid for prefix in ["gpt", "o1", "o3"])

    # Filter out embedding models from the local Ollama list
    def get_ollama_chat():
        all_models = list_ollama_models()
        return [m for m in all_models if not any(e in m.lower() for e in ["embed", "mxbai"])]

    providers = {
        "openai": lambda: list_openai_models(openai_chat_filter),
        "groq": list_groq_models,
        "gemini": lambda: list_gemini_models("generateContent"),
        "ollama": get_ollama_chat,
    }

    for name, fn in providers.items():
        try:
            result[name] = fn()
        except Exception as e:
            print(f"Error fetching chat models for {name}: {e}")
            result[name] = []

    return result


def list_all_available_embedding_models() -> dict[str, list[str]]:
    """
    Queries all configured embedding providers for their available models.
    """
    result: dict[str, list[str]] = {}

    openai_embed_filter = lambda mid: "embedding" in mid

    # Only return models meant for embeddings from Ollama
    def get_ollama_embeddings():
        all_models = list_ollama_models()
        return [m for m in all_models if any(e in m.lower() for e in ["embed", "mxbai"])]

    providers = {
        "openai": lambda: list_openai_models(openai_embed_filter),
        "google": lambda: list_gemini_models("embedContent"),
        "ollama": get_ollama_embeddings,
    }

    for name, fn in providers.items():
        try:
            result[name] = fn()
        except Exception as e:
            print(f"Error fetching embedding models for {name}: {e}")
            result[name] = []

    return result


def list_available_embedding_models() -> list[str]:
    """Queries curated embedding models"""
    return sorted(EMBEDDING_CONFIGS.keys())


if __name__ == "__main__":
    print("--- CHAT MODELS ---")
    print(list_available_chat_models())
    print("\n--- ALL EMBEDDING MODELS ---")
    print(list_all_available_embedding_models())
    print("\n--- EMBEDDING MODELS ---")
    print(list_available_embedding_models())
