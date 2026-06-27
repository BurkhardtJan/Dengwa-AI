# Dengwa AI

> *From Proto-Indo-European \*dn̥ǵʰwéh₂ (language, tongue) and Japanese 電話 denwa (telephone, literally: electric
speech) — Dengwa AI is a language learning application that meets you where you actually are: reading real content, not
drilling fake sentences.*

Upload subtitles, books, or articles in your target language. Dengwa extracts vocabulary in context, builds your
personal deck, and lets you practice with an AI that knows exactly what you've been reading.

---

## What it does

|                           |                                                          |
|---------------------------|----------------------------------------------------------|
| **Media import**          | Upload SRT, TXT, or documents in your target language    |
| **Vocabulary extraction** | LLM identifies and explains vocabulary in context        |
| **Contextual chat**       | Practice with an AI that knows your vocabulary and media |
| **Multi-LLM support**     | Groq / Gemini / OpenAI — swappable                       |

---

## Endpoints

### System

| Method    | Endpoint  | Description  |
|-----------|-----------|--------------|
| **`GET`** | `/health` | Health check |

### Users

| Method     | Endpoint          | Description             |
|------------|-------------------|-------------------------|
| **`POST`** | `/users/register` | Register a new user     |
| **`POST`** | `/users/login`    | Login user              |
| **`GET`**  | `/users/me`       | Return user information |

### Languages

| Method       | Endpoint                    | Description             |
|--------------|-----------------------------|-------------------------|
| **`GET`**    | `/languages`                | List learning languages |
| **`POST`**   | `/languages`                | Create language         |
| **`GET`**    | `/languages/{lan}`          | Get language info       |
| **`PUT`**    | `/languages/{lan}`          | Update language         |
| **`DELETE`** | `/languages/{lan}`          | Delete language         |
| **`GET`**    | `/languages/{lan}/progress` | Get learning progress   |

### Vocabularies

| Method       | Endpoint             | Description             |
|--------------|----------------------|-------------------------|
| **`GET`**    | `/vocabularies`      | Get vocabulary list     |
| **`POST`**   | `/vocabularies`      | Post new vocabulary     |
| **`GET`**    | `/vocabularies/{id}` | Get vocabulary by ID    |
| **`PUT`**    | `/vocabularies/{id}` | Update vocabulary by ID |
| **`DELETE`** | `/vocabularies/{id}` | Delete vocabulary by ID |

### Media

| Method       | Endpoint                       | Description                       |
|--------------|--------------------------------|-----------------------------------|
| **`POST`**   | `/media`                       | Upload a medium (SRT, TXT)        |
| **`GET`**    | `/media`                       | Get all media for a language      |
| **`GET`**    | `/media/{media_id}`            | Get media by ID                   |
| **`GET`**    | `/media/{media_id}/file`       | Stream the raw file for a medium. |
| **`DELETE`** | `/media/{media_id}`            | Delete media by ID                |
| **`POST`**   | `/media/{media_id}/vocabulary` | Extract vocabulary from medium    |

### Chats

| Method       | Endpoint                 | Description                    |
|--------------|--------------------------|--------------------------------|
| **`GET`**    | `/chats`                 | Get all chats for current user |
| **`POST`**   | `/chats`                 | Create a new chat for a medium |
| **`GET`**    | `/languages/{lan}/chats` | Get all chats for a language   |
| **`GET`**    | `/chats/{chat_id}`       | Get chat history               |
| **`POST`**   | `/chats/{chat_id}`       | Send a message to the AI       |
| **`DELETE`** | `/chats/{chat_id}`       | Delete Chat                    |

---

## Tech Stack

| Component | Technology              |
|-----------|-------------------------|
| Backend   | FastAPI                 |
| Database  | PostgreSQL              |
| LLM 1     | Groq (llama-3.3-70b)    |
| LLM 2     | Gemini (2.5-flash-lite) |
| LLM 3     | OpenAI (gpt-5-nano)     |

---

## Getting Started

### Setup Database:

Install PostgreSQL. Ubuntu example:

```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Create Database and start PostgreSQL:

```bash
createdb dengwa_db
psql
```

In PostgreSQL:

```postgresql
ALTER USER postgres WITH PASSWORD 'your_password';
```

### Backend:

```bash
# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# → Add GROQ_API_KEY and GEMINI_API_KEY

# Run
python main.py
```

### Frontend:

```bash
cd frontend
nvm use 22
pnpm install
pnpm dev
```

## Roadmap

### Done

- [x] Initial project setup (DB, Backend)
- [x] SQLAlchemy models & Pydantic schemas
- [x] LLM integration (Groq/Gemini/OpenAI)
- [x] POST endpoints (languages, media, chats, vocabularies)
- [x] Media processing (SRT, TXT parsing)
- [x] LLM integration in chat (conversation history from DB)
- [x] Vocabulary CRUD endpoints
- [x] Vocabulary generation from media via LLM
- [x] Language endpoints (CRUD)
- [x] Full CRUD for media, chats, languages
- [x] Code refactoring (routers/, llm/, services/ structure)
- [x] Architecture diagrams (Mermaid)
- [x] Switch to LangGraph as AI wrapper
- [x] JWT authentication (login/register)
- [x] UUID instead of serial ID for endpoints
- [x] Frontend setup (React 18 + Vite + TypeScript + Tailwind + shadcn/ui)
- [x] Media upload & management
- [x] Add Docker Image
- [x] Added Tests (pytest)
- [x] Multiple Language UI with i18n
- [x] Translate UI
- [x] Return file endpoint and show in frontend


### Backend

- [ ] RAG — inject vocabulary context into chat prompts (pgvector)
- [ ] Progress endpoint — implement actual logic (currently stub)
- [ ] Add default Vocab starter set (HSK, JLPT, ...)
- [ ] Other Media Parsing
- [ ] Alembic
- [ ] Add License

### Frontend

- [ ] Add Flags
- [ ] Comparison of LLMs

## Architecture

### Backend

```mermaid
graph TB
    subgraph Client["Client layer"]
        HTTP["HTTP client (curl / Postman)"]
        Swagger["FastAPI Swagger UI (/docs)"]
    end

    subgraph Backend["Backend layer (FastAPI)"]
        Controller["Main — main.py"]
        Schemas["Schemas — schemas.py"]
        Models["Models — models.py"]
        Database["database.py"]

        subgraph Routers["Router layer (routers/)"]
            direction LR
            SystemRouter["system.py"]
            UserRouter["users.py"]
            LanguageRouter["languages.py"]
            MediaRouter["media.py"]
            VocabRouter["vocabularies.py"]
            ChatRouter["chats.py"]
            SystemRouter ~~~ UserRouter
            UserRouter ~~~ LanguageRouter
            LanguageRouter ~~~ MediaRouter
            MediaRouter ~~~ VocabRouter
            VocabRouter ~~~ ChatRouter
        end

        subgraph Services["Service layer (services/)"]
            direction LR
            System["system.py"]
            Users["users.py"]
            Language["language_service.py"]
            Media["media_service.py"]
            Vocab["vocabulary_service.py"]
            Chat["chat_service.py"]
            System ~~~ Users
            Users ~~~ Language
            Language ~~~ Media
            Media ~~~ Vocab
            Vocab ~~~ Chat
        end
        subgraph LLMServices["LLM Service layer (llm/)"]
            LLM["llm_service.py"]
            Prompts["prompts.py"]
        end

        Controller --> Routers
        Routers <-->|validation| Schemas
        Services <-->|Data| Database
        Routers --> Services
        Services <--> LLMServices
    end

    subgraph DB["Database layer"]
        Postgres[("PostgreSQL")]
    end

    subgraph AI["External AI APIs"]
        Groq["Groq · llama-3.3-70b"]
        Gemini["Google Gemini 2.5 flash lite"]
        OpenAI["OpenAI · gpt-5-nano"]
    end

    HTTP -->|HTTP / JSON| Controller
    Swagger -->|HTTP / JSON| Controller
    LLM -->|HTTPS / API Key| Groq
    LLM -->|HTTPS / API Key| Gemini
    LLM -->|HTTPS / API Key| OpenAI
    Schemas <--> Models
    Models <--> Database
    Database <-->|SQLAlchemy| Postgres


```

---

## Database

### Diagram

```mermaid
erDiagram
    chat_histories }o--|| chats: references
    chats }o--|| media: references
    media_chunks }o--|| media: references
    language_learning }o--|| users: references
    language_learning ||--o{ media: references
    learning_progress }o--|| media: references
    media_vocabularies }o--|| media: references
    vocabularies ||--o{ media_vocabularies: references
    vocabularies }o--|| language_learning: references
    chats }o--|| users: references

    users {
        UUID id
        TEXT username
        TEXT hashed_password
        TEXT native_language
    }

    media {
        UUID id
        TEXT title
        TEXT content_type
        TEXT file_path
        TEXT extracted_content
        INTEGER learning_id
    }
    media_chunks {
        UUID id
        UUID media_id
        TEXT content
        VECTOR embedding
    }

    vocabularies {
        UUID id
        INTEGER learning_id
        TEXT word
        TEXT translation
        TEXT context_sentence
        TEXT language
        TIMESTAMP created_at
        TIMESTAMP due
        INTEGER interval_days
        FLOAT ease_factor
        INTEGER repetitions
        INTEGER lapses
        FLOAT llm_mastery_score
        TEXT llm_notes
        TIMESTAMP last_interaction
    }

    chats {
        UUID id
        INTEGER media_id
        INTEGER user_id
    }

    chat_histories {
        UUID id
        INTEGER chat_id
        TEXT message
        TIMESTAMP timestamp
        TEXT role
    }

    language_learning {
        UUID id
        INTEGER user_id
        TEXT learning_language
        TEXT proficiency_level
        TEXT user_motivation
    }

    learning_progress {
        UUID id
        INTEGER media_id
        TEXT proficiency_level
        TEXT comment
    }

    media_vocabularies {
        UUID id
        INTEGER media_id
        INTEGER vocabulary_id
    }
```