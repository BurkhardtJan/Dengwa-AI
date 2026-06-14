from fastapi import FastAPI
import uvicorn
from database import Base, engine
from routers import system, languages, media, chats, vocabularies

app = FastAPI()

app.include_router(system.router)
app.include_router(languages.router)
app.include_router(media.router)
app.include_router(chats.router)
app.include_router(vocabularies.router)

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    uvicorn.run(app, host="0.0.0.0", port=8000)
