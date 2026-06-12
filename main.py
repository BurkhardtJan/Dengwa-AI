from fastapi import FastAPI
import uvicorn
from dependencies import *

from database import get_db, Base, engine
from models import User

from routers import languages, media, chats, vocabularies

app = FastAPI()

app.include_router(languages.router)
app.include_router(media.router)
app.include_router(chats.router)
app.include_router(vocabularies.router)


@app.get("/health")
async def root():
    """Health check of the Website"""
    return {"message": "Immersio AI running"}


@app.post("/register")
async def register(username: str, native_language: str = "de", db: Session = Depends(get_db)):
    """Register a new user"""
    new_user = User(username=username, native_language=native_language)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
    )
