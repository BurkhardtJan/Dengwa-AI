from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import uvicorn
from database import Base, engine
from routers import system, users, languages, media, chats, vocabularies, llm_models, reviews
from sqlalchemy import text
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from rate_limit import limiter

# Without this, only WARNING/ERROR ever reach the console (Python's
# logging module falls back to a bare "last resort" stderr handler at
# WARNING level when nothing is configured) — the logger.info() progress
# lines added for background tasks (media_service.py) would otherwise
# be invisible even though the code runs them.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

with engine.connect() as conn:
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    conn.commit()
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
app.include_router(llm_models.router)
app.include_router(reviews.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
