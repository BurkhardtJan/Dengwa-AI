from fastapi import FastAPI
import uvicorn

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Immersio AI running"}


@app.get("/languages/{lan}/vocabularies")
async def get_vocabularies(lan: str):
    return {
        "language": lan,
        "message": "vocabs"
    }


@app.get("/languages/{lan}/media")
async def get_media(lan: str):
    return {
        "language": lan,
        "message": "media"
    }


@app.post("/languages/{lan}/media")
async def post_media(lan: str):
    return {
        "language": lan,
        "message": "media uploaded"
    }


@app.get("/languages/{lan}/chats")
async def get_chats(lan: str):
    return {
        "language": lan,
        "message": "chats"
    }


@app.post("/languages/{lan}/chats/{chat_id}")
async def post_chat(
    lan: str,
    chat_id: int
):
    return {
        "language": lan,
        "chat_id": chat_id,
        "message": "chat"
    }


@app.get("/languages/{lan}/progress")
async def get_progress(lan: str):
    return {
        "language": lan,
        "message": "progress"
    }


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
    )