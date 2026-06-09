import os
from dotenv import load_dotenv
from groq import Groq
from google import genai
from google.genai import types
from openai import OpenAI
from pydantic import BaseModel

load_dotenv()

DEFAULT_PROVIDER = "gemini"


def gemini_client(
        messages: list[dict],
        system_prompt: str,
        model: str = "gemini-2.5-flash-lite",
        temperature: float = 1.0,
        max_tokens: int = 1000,
        response_schema: type[BaseModel] | None = None,
) -> str:
    """Client for gemini API"""
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    gemini_messages = []
    for msg in messages:
        role = "model" if msg["role"] == "assistant" else msg["role"]
        gemini_messages.append(
            types.Content(role=role, parts=[types.Part(text=msg["content"])])
        )

    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        temperature=temperature,
        max_output_tokens=max_tokens,
    )
    if response_schema:
        config.response_mime_type = "application/json"
        config.response_schema = response_schema

    resp = client.models.generate_content(model=model, contents=gemini_messages, config=config)
    return resp.text


def groq_client(
        messages: list[dict],
        system_prompt: str,
        model: str = "llama-3.3-70b-versatile",
        temperature: float = 1.0,
        max_tokens: int = 1000,
        response_schema: type[BaseModel] | None = None,
) -> str:
    """Client for groq API"""
    client = Groq(api_key=os.environ["GROQ_API_KEY"])

    kwargs = {
        "model": model,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if response_schema:
        kwargs["response_format"] = {"type": "json_object"}
        schema_str = response_schema.model_json_schema()
        system_prompt = system_prompt + f"\nAntworte ausschließlich mit validem JSON das diesem Schema entspricht:\n{schema_str}"
    kwargs["messages"] = [{"role": "system", "content": system_prompt}, *messages]

    response = client.chat.completions.create(**kwargs)
    return response.choices[0].message.content


def openai_client(
        messages: list[dict],
        system_prompt: str,
        model: str = "gpt-5-nano",
        temperature: float = 1.0,
        max_tokens: int = 5000,
        response_schema: type[BaseModel] | None = None,
) -> str:
    """Client for openai API"""
    client = OpenAI()

    kwargs = {
        "model": model,
        "messages": [{"role": "system", "content": system_prompt}, *messages],
        # "max_output_tokens": max_tokens,
    }

    if "gpt-5" not in model and "o1" not in model:
        kwargs["temperature"] = temperature
        kwargs["max_tokens"] = max_tokens
    else:
        kwargs["max_completion_tokens"] = max_tokens

    if response_schema:
        response = client.beta.chat.completions.parse(
            **kwargs,
            response_format=response_schema,
        )
        return response.choices[0].message.parsed.model_dump_json()
    else:
        response = client.chat.completions.create(**kwargs)
        return response.choices[0].message.content


def call_llm(
        messages: list[dict],
        system_prompt: str,
        provider: str | None = None,
        model: str | None = None,
        temperature: float = 1.0,
        max_tokens: int = 5000,
        response_schema: type[BaseModel] | None = None,
) -> str:
    """Wrapper for AI clients"""
    if not provider:
        provider = DEFAULT_PROVIDER
    if provider == "groq":
        return groq_client(
            messages=messages,
            system_prompt=system_prompt,
            model=model or "llama-3.3-70b-versatile",
            temperature=temperature,
            max_tokens=max_tokens,
            response_schema=response_schema
        )
    elif provider == "gemini":
        return gemini_client(
            messages=messages,
            system_prompt=system_prompt,
            model=model or "gemini-2.5-flash-lite",
            temperature=temperature,
            max_tokens=max_tokens,
            response_schema=response_schema
        )
    elif provider == "openai":
        return openai_client(
            messages=messages,
            system_prompt=system_prompt,
            model=model or "gpt-5-nano",
            # temperature=temperature,
            max_tokens=max_tokens,
            response_schema=response_schema
        )
    else:
        raise ValueError(f"Unknown provider '{provider}'. Available: groq, gemini, openai")
