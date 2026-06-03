from fastapi import FastAPI
import uvicorn
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/vocabularies")
async def get_vocabularies():
    return {"message": "vocabs"}


@app.get("/chats")
async def get_chats():
    return {"message": "chats"}


@app.post("/chats/{chat_id}")
async def post_chat(chat_id: int):
    return {"message": "chat"}


@app.get("/media")
async def get_media():
    return {"message": "media"}


@app.post("/media")
async def post_media():
    return {"message": "media"}


@app.get("/progress")
async def get_progress():
    return {"message": "progress"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
