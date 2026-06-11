from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from typing import List
import uvicorn
import os
import shutil
from media_processing import extract_content
from llm_service import call_llm
from prompts import build_system_prompt_language_chat, build_vocab_extract_prompt
from vocabulary import create_vocab, get_or_create_vocab, create_media_vocab

from database import get_db, Base, engine
from models import LanguageLearning, Media, Vocabulary, MediaVocabulary, Chat, ChatHistory, LearningProgress, User
from schemas import (
    LanguageLearningResponse,
    MediaResponse,
    VocabularyResponse, VocabularyCreate, VocabularyUpdate,
    ChatCreate, ChatResponse,
    ChatMessageRequest, ChatMessageResponse,
    VocabularyExtraction
)

app = FastAPI()


def get_current_user():
    """Gets id of current user by Auth"""
    # TODO: AUTH
    return {"id": 1}


def get_learning_or_404(db: Session, lan: str, user_id: int):
    """Gets learning info by user and language. Creates 404 if not found."""
    learning = (
        db.query(LanguageLearning)
        .filter(
            LanguageLearning.learning_language == lan,
            LanguageLearning.user_id == user_id
        )
        .first()
    )

    if not learning:
        raise HTTPException(
            status_code=404,
            detail="Language learning not found"
        )

    return learning


def get_or_create_learning(db: Session, lan: str, user_id: int) -> LanguageLearning:
    """Gets learning info by user and language. Creates new learning id if not found."""
    learning = (
        db.query(LanguageLearning)
        .filter(
            LanguageLearning.learning_language == lan,
            LanguageLearning.user_id == user_id
        )
        .first()
    )

    if not learning:
        learning = LanguageLearning(
            user_id=user_id,
            learning_language=lan,
            proficiency_level="A0"
        )
        db.add(learning)
        db.commit()
        db.refresh(learning)

    return learning


def get_media_or_404(db: Session, media_id: int) -> Media:
    """Returns a Media record or raises 404."""
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Medium nicht gefunden oder Zugriff verweigert.")
    return media


def get_vocab_or_404(db: Session, vocab_id: int, learning_id: int) -> Vocabulary:
    """Returns a Vocabulary record scoped to a learning entry, or raises 404."""
    vocab = (
        db.query(Vocabulary)
        .filter(
            Vocabulary.id == vocab_id,
            Vocabulary.learning_id == learning_id
        )
        .first()
    )
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    return vocab


#################################################
###############Endpoints####################
###########################################
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


@app.get("/languages", response_model=List[LanguageLearningResponse])
async def get_languages(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Returns list of languages for current user"""
    learning = (
        db.query(LanguageLearning)
        .filter(
            LanguageLearning.user_id == current_user["id"]
        )
    ).all()
    return learning


@app.get("/languages/{lan}", response_model=LanguageLearningResponse)
async def get_language(lan: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Returns language info"""
    learning = get_learning_or_404(db, lan, current_user["id"])
    return learning


@app.get("/languages/{lan}/media", response_model=List[MediaResponse])
async def get_media(lan: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Returns media list for language"""
    learning = get_learning_or_404(db, lan, current_user["id"])
    return db.query(Media).filter(Media.learning_id == learning.id).all()


def save_uploaded_file(file: UploadFile, user_id: int, lan: str) -> str:
    """
    Saves an uploaded file to uploads/<user_id>/<lan>/<filename>.
    Returns the file path.
    Raises HTTPException on write error.
    """
    user_lan_dir = os.path.join("uploads", str(user_id), lan)
    os.makedirs(user_lan_dir, exist_ok=True)
    file_path = os.path.join(user_lan_dir, file.filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Speichern der Datei: {str(e)}")


def create_media_record(db: Session, title: str, file: UploadFile, file_path: str, learning_id: int) -> Media:
    """Creates and persists a Media DB record."""
    media = Media(
        title=title,
        content_type=file.content_type,
        file_path=file_path,
        extracted_content=extract_content(file.content_type, file_path),
        learning_id=learning_id
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    return media


@app.post("/languages/{lan}/media", response_model=MediaResponse)
async def post_media(lan: str, title: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db),
                     current_user=Depends(get_current_user)):
    """Upload a Medium"""
    learning = get_or_create_learning(db, lan, current_user["id"])
    file_path = save_uploaded_file(file, current_user["id"], lan)
    return create_media_record(db, title, file, file_path, learning.id)


@app.get("/languages/{lan}/vocabularies", response_model=List[VocabularyResponse])
async def get_vocabularies(lan: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get vocabulary list"""
    learning = get_learning_or_404(db, lan, current_user["id"])

    query = db.query(Vocabulary).filter(Vocabulary.learning_id == learning.id)
    return query.all()


@app.post("/languages/{lan}/vocabularies", response_model=VocabularyResponse)
async def create_vocabulary_endpoint(lan: str, payload: VocabularyCreate, db: Session = Depends(get_db),
                                     current_user=Depends(get_current_user)):
    """Post new vocabulary"""
    learning = get_or_create_learning(db, lan, current_user["id"])
    vocab = get_or_create_vocab(db=db, learning_id=learning.id, word=payload.word, translation=payload.translation,
                                context_sentence=payload.context_sentence, language=lan)
    return vocab


@app.get("/languages/{lan}/vocabularies/{vocab_id}", response_model=VocabularyResponse)
async def get_vocabulary(lan: str, vocab_id: int, db: Session = Depends(get_db),
                         current_user=Depends(get_current_user)):
    """Get vocabulary by ID"""
    learning = get_learning_or_404(db, lan, current_user["id"])

    vocab = (
        db.query(Vocabulary)
        .filter(
            Vocabulary.id == vocab_id,
            Vocabulary.learning_id == learning.id
        )
        .first()
    )

    if not vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found")

    return vocab


@app.put("/languages/{lan}/vocabularies/{vocab_id}", response_model=VocabularyResponse)
async def update_vocabulary(lan: str, vocab_id: int, payload: VocabularyUpdate, db: Session = Depends(get_db),
                            current_user=Depends(get_current_user)):
    """Update Vocabulary by ID"""
    learning = get_learning_or_404(db, lan, current_user["id"])

    vocab = (
        db.query(Vocabulary)
        .filter(
            Vocabulary.id == vocab_id,
            Vocabulary.learning_id == learning.id
        )
        .first()
    )

    if not vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found")

    if payload.word is not None:
        vocab.word = payload.word

    if payload.translation is not None:
        vocab.translation = payload.translation

    if payload.context_sentence is not None:
        vocab.context_sentence = payload.context_sentence

    db.commit()
    db.refresh(vocab)

    return vocab


@app.delete("/languages/{lan}/vocabularies/{vocab_id}")
async def delete_vocabulary(lan: str, vocab_id: int, db: Session = Depends(get_db),
                            current_user=Depends(get_current_user)):
    """Delete Vocabulary by id"""
    learning = get_learning_or_404(db, lan, current_user["id"])
    vocab = (
        db.query(Vocabulary)
        .filter(
            Vocabulary.id == vocab_id,
            Vocabulary.learning_id == learning.id
        )
        .first()
    )
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found")

    db.delete(vocab)
    db.commit()

    return {"status": "deleted"}


@app.get("/languages/{lan}/chats", response_model=List[ChatResponse])
async def get_language_chats(lan: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get all chats for a language"""
    learning = get_learning_or_404(db, lan, current_user["id"])

    return (
        db.query(Chat)
        .join(Media, Chat.media_id == Media.id)
        .filter(Chat.user_id == current_user["id"], Media.learning_id == learning.id)
        .all()
    )


@app.get("/chats", response_model=List[ChatResponse])
async def get_chats(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get all chats for current user"""
    return db.query(Chat).filter(Chat.user_id == current_user["id"]).all()


@app.get("/chats/{chat_id}", response_model=List[ChatMessageResponse])
async def get_chat_history(
        chat_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """Get chat history"""
    chat = db.query(Chat).filter(Chat.user_chat_id == chat_id, Chat.user_id == current_user["id"]).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    return db.query(ChatHistory).filter(
        ChatHistory.chat_id == chat.id
    ).order_by(ChatHistory.timestamp).all()


@app.post("/media/{media_id}/chats", response_model=ChatCreate)
async def create_chat(
        media_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """Create a new chat for a medium"""
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(
            status_code=404,
            detail="Medium nicht gefunden oder Zugriff verweigert."
        )

    last_chat_id = db.query(Chat).filter(Chat.user_id == current_user["id"]).order_by(Chat.user_chat_id.desc()).first()
    user_chat_id = (last_chat_id.user_chat_id + 1) if last_chat_id else 1

    new_chat = Chat(
        media_id=media_id,
        user_id=current_user["id"],
        user_chat_id=user_chat_id
    )

    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)

    return new_chat


@app.post("/chats/{chat_id}", response_model=List[ChatMessageResponse])
async def post_chat_message(
        chat_id: int,
        request: ChatMessageRequest,
        provider: str | None = None,
        model: str | None = None,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """Send a message to the AI"""
    chat = db.query(Chat).filter(Chat.user_chat_id == chat_id, Chat.user_id == current_user["id"]).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    history = (
        db.query(ChatHistory)
        .filter(ChatHistory.chat_id == chat.id)
        .order_by(ChatHistory.timestamp.desc())
        .limit(20)
        .all()
    )
    messages = [{"role": h.role, "content": h.message} for h in reversed(history)]
    messages.append({"role": "user", "content": request.message})

    system_prompt = build_system_prompt_language_chat(chat)

    user_message = ChatHistory(chat_id=chat.id, role="user", message=request.message)
    db.add(user_message)

    ai_response = (f"You asked about: {request.message}")
    ai_response = call_llm(
        messages=messages,
        system_prompt=system_prompt,
        provider=provider,
        model=model,
    )

    assistant_message = ChatHistory(chat_id=chat.id, role="assistant", message=ai_response)
    db.add(assistant_message)
    db.commit()

    return [user_message, assistant_message]


@app.post("/media/{media_id}/vocabulary")
async def extract_media_vocabulary(
        media_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """Create a new chat for a medium"""
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(
            status_code=404,
            detail="Medium nicht gefunden oder Zugriff verweigert."
        )

    system_prompt = build_vocab_extract_prompt(media)
    messages = [{"role": "user", "content": "Gib zwischen 10 Vokabeln zurück"}]

    response_structured = call_llm(
        messages=messages,
        system_prompt=system_prompt,
        provider="openai",
        temperature=0.2,
        response_schema=VocabularyExtraction
    )
    for item in response_structured.vocabularies:
        create_media_vocab(db, media.id, media.learning_id, item.word, item.translation, item.context_sentence,
                           media.language_learning.learning_language)

    return response_structured


@app.get("/languages/{lan}/progress")
async def get_progress(lan: str):
    """Get learning progress"""
    # TODO
    return {
        "language": lan,
        "message": "progress"
    }


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
    )
