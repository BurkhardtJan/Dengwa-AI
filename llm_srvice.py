import os
from dotenv import load_dotenv
from groq import Groq
from google import genai
from google.genai import types
from openai import OpenAI

load_dotenv()


def openai_client():
    client = OpenAI()

    model = "gpt-5-nano"

    user_prompt = "Was ist GenAI?"

    response = client.responses.create(
        model=model,
        input=[
            {"role": "system", "content": "Du bist ein hilfreicher Assistent."},
            {"role": "user", "content": user_prompt},
            {"role": "assistant", "content": "GenAI ist ein Gemüse!"},
            {"role": "user", "content": "Bist du sicher? Wie bist du darauf gekommen?"},
        ],
        max_output_tokens=1500,
    )

    print("Generierter Text:\n", response.output_text)


def gemini_client():
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

    resp = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents="PLEASE SPEAK ENGLISH?!",
        config=types.GenerateContentConfig(
            system_instruction=(
                "You are Italian and must answer only in Italian. "
                "You cannot speak any other language."
            ),
            temperature=0.2,
            max_output_tokens=80,
        ),
    )
    print(resp.text)

def groq_client():
    # Initialize the Groq client
    client = Groq(api_key=os.environ["GROQ_API_KEY"])

    # Specify the model to use
    model = "llama-3.3-70b-versatile"

    # System's task
    system_prompt = "You are a helpful assistant."

    # User's request
    user_prompt = "What is GenAI?"

    # Generate a response using the Groq API
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )

    # Display the generated text
    print("Generated text:\n", response.choices[0].message.content)

if __name__ == "__main__":
    gemini_client()
    #groq_client()
    openai_client()