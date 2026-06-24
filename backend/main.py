from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from database import Base, engine
from routers import system, users, languages, media, chats, vocabularies

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(system.router)
app.include_router(users.router)
app.include_router(languages.router)
app.include_router(media.router)
app.include_router(chats.router)
app.include_router(vocabularies.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
