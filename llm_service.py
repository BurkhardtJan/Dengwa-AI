import os
from dotenv import load_dotenv
from groq import Groq
from google import genai
from google.genai import types
from openai import OpenAI

load_dotenv()

DEFAULT_PROVIDER = "gemini"

def gemini_client(
        messages: list[dict],
        system_prompt: str,
        model: str = "gemini-2.5-flash-lite",
        temperature: float = 1.0,
        max_tokens: int = 1000,
) -> str:
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    gemini_messages = []
    for msg in messages:
        role = "model" if msg["role"] == "assistant" else msg["role"]
        gemini_messages.append(
            types.Content(role=role, parts=[types.Part(text=msg["content"])])
        )

    resp = client.models.generate_content(
        model=model,
        contents=gemini_messages,
        config=types.GenerateContentConfig(
            system_instruction=(system_prompt),
            temperature=temperature,
            max_output_tokens=max_tokens,
        ),
    )
    return resp.text


def groq_client(
        messages: list[dict],
        system_prompt: str,
        model: str = "llama-3.3-70b-versatile",
        temperature: float = 1.0,
        max_tokens: int = 1000,
) -> str:
    client = Groq(api_key=os.environ["GROQ_API_KEY"])

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            *messages,
        ],
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content


def openai_client(
        messages: list[dict],
        system_prompt: str,
        model: str = "gpt-5-nano",
        temperature: float = 1.0,
        max_tokens: int = 5000,
) -> str:
    client = OpenAI()

    response = client.responses.create(
        model=model,
        input=[
            {"role": "system", "content": system_prompt},
            *messages,
        ],
        temperature=temperature,
        max_output_tokens=max_tokens,
    )
    return response.output_text


def call_llm(
        messages: list[dict],
        system_prompt: str,
        provider: str | None = None,
        model: str | None = None,
        temperature: float = 1.0,
        max_tokens: int = 1000,
) -> str:
    if not provider:
        provider = DEFAULT_PROVIDER
    if provider == "groq":
        return groq_client(
            messages=messages,
            system_prompt=system_prompt,
            model=model or "llama-3.3-70b-versatile",
            temperature=temperature,
            max_tokens=max_tokens,
        )
    elif provider == "gemini":
        return gemini_client(
            messages=messages,
            system_prompt=system_prompt,
            model=model or "gemini-2.5-flash-lite",
            temperature=temperature,
            max_tokens=max_tokens,
        )
    elif provider == "openai":
        return openai_client(
            messages=messages,
            system_prompt=system_prompt,
            model=model or "gpt-5-nano",
            temperature=temperature,
            max_tokens=max_tokens,
        )
    else:
        raise ValueError(f"Unknown provider '{provider}'. Available: groq, gemini")


if __name__ == "__main__":
    """
    gemini_answer = gemini_client(messages=[{"role": "user", "content": "Was ist ein LLM?"}],
                                  system_prompt="Sprich wie ein baby")
    print(gemini_answer)
    groq_answer = groq_client(messages=[{"role": "user", "content": "Was ist ein LLM?"}],
                              system_prompt="Sprich wie ein baby")
    print(groq_answer)
    openai_answer = openai_client(messages=[{"role": "user", "content": "Was ist ein LLM?"}],
                                  system_prompt="Sprich wie ein baby")
    print(openai_answer)
    """
    print(call_llm(messages=[{"role": "user", "content": "Was ist ein LLM?"}],
                   system_prompt="Sprich wie ein baby"))
