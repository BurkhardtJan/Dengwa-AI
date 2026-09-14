import os
import shutil
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session
from uuid import UUID
from database import SessionLocal
from models import Media, MediaVocabulary, LanguageLearning, Chat
from schemas import VocabularyExtraction, MediaMetadataExtraction
from llm.prompts import (
    build_vocab_extract_prompt,
    build_vocab_extract_user_message,
    build_media_metadata_prompt,
    build_media_metadata_reduce_input,
    build_chat_title_prompt,
    build_chunk_summary_prompt,
)
from llm.client import call_llm
from llm.rag_service import embed_media, split_for_processing, PROCESSING_CHUNK_SIZE
from services.vocabulary_service import get_or_create_vocab
from pypdf import PdfReader
from ebooklib import epub
import ebooklib
from bs4 import BeautifulSoup
from docx import Document as DocxDocument
from odf import text as odf_text
from odf import teletype
from odf.opendocument import load as odf_load
import logging

logger = logging.getLogger(__name__)
OCTET_STREAM_EXTENSIONS = {".txt", ".srt", ".vtt", ".md"}


def read_text_file(file_path: str) -> str:
    """Helper function to read text file"""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except UnicodeDecodeError:
        with open(file_path, "r", encoding="latin-1") as f:
            return f.read()


def extract_pdf_text(file_path: str) -> str | None:
    """Extracts pages from pdf file"""
    try:
        reader = PdfReader(file_path)
        text_parts = [
            text for page in reader.pages
            if (text := page.extract_text())
        ]
        return "\n\n".join(text_parts) if text_parts else None
    except Exception:
        return None


def extract_epub_chapters(file_path: str) -> list[str] | None:
    """
    Extracts one text chunk per spine item (an epub's actual reading order —
    typically one XHTML file per chapter/section). Returns None on failure
    or if nothing could be extracted, so callers can fall back to the
    generic character-based chunker instead.

    Used for chapter-aware processing (summarization, vocab extraction).
    For flat storage/display text, use extract_epub_text() below.
    """
    try:
        book = epub.read_epub(file_path)
        chapters = []

        for idref, _linear in book.spine:
            item = book.get_item_with_id(idref)
            if item is None or item.get_type() != ebooklib.ITEM_DOCUMENT:
                continue
            soup = BeautifulSoup(item.get_content(), "html.parser")
            text = soup.get_text(separator="\n", strip=True)
            if text:
                chapters.append(text)

        return chapters or None
    except Exception:
        return None


def extract_epub_text(file_path: str) -> str | None:
    """Extract text from epub file (flat — chapter boundaries lost).
    Used for extracted_content storage/display/RAG fallback."""
    chapters = extract_epub_chapters(file_path)
    return "\n\n".join(chapters) if chapters else None


def extract_docx_text(file_path: str) -> str | None:
    """Extract text from docx"""
    try:
        doc = DocxDocument(file_path)
        text_parts = [p.text for p in doc.paragraphs if p.text.strip()]

        # Auch Text aus Tabellen mitnehmen
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    if cell.text.strip():
                        text_parts.append(cell.text)

        return "\n\n".join(text_parts) if text_parts else None
    except Exception:
        return None


def extract_odt_text(file_path: str) -> str | None:
    """Extract text from odt"""
    try:
        doc = odf_load(file_path)
        paragraphs = doc.getElementsByType(odf_text.P)
        text_parts = [
            "".join(node.data for node in p.childNodes if node.nodeType == node.TEXT_NODE)
            for p in paragraphs
        ]
        text_parts = [teletype.extractText(p) for p in paragraphs]

        return "\n\n".join(text_parts) if text_parts else None
    except Exception:
        return None


CONTENT_TYPE_EXTRACTORS: dict[str, callable] = {
    "application/x-subrip": read_text_file,
    "application/pdf": extract_pdf_text,
    "application/epub+zip": extract_epub_text,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": extract_docx_text,
    "application/vnd.oasis.opendocument.text": extract_odt_text,
}


def extract_content(content_type: str, file_path: str) -> str | None:
    """Helper function to extract content from files"""
    if content_type.startswith("text/"):
        return read_text_file(file_path)

    if content_type in CONTENT_TYPE_EXTRACTORS:
        return CONTENT_TYPE_EXTRACTORS[content_type](file_path)

    if content_type == "application/octet-stream":
        ext = os.path.splitext(file_path)[1].lower()
        if ext in OCTET_STREAM_EXTENSIONS:
            return read_text_file(file_path)

    return None


def get_media_or_404(db: Session, media_id: UUID, user_id: UUID) -> Media:
    """Returns a Media record or raises 404."""
    media = (
        db.query(Media)
        .join(LanguageLearning, Media.learning_id == LanguageLearning.id)
        .filter(
            Media.id == media_id,
            LanguageLearning.user_id == user_id,
        )
        .first()
    )
    if not media:
        raise HTTPException(status_code=404, detail="Medium nicht gefunden")
    return media


def create_media_vocab(
        db: Session,
        media_id: UUID,
        learning_id: UUID,
        word: str,
        translation: str | None = None,
        context_sentence: str | None = None,
        language: str | None = None,
) -> MediaVocabulary:
    """
    Creates media vocabulary and if necessary normal vocabulary.
    """

    vocab = get_or_create_vocab(
        db=db,
        learning_id=learning_id,
        word=word,
        translation=translation,
        context_sentence=context_sentence,
        language=language
    )

    existing_link = (
        db.query(MediaVocabulary)
        .filter(
            MediaVocabulary.media_id == media_id,
            MediaVocabulary.vocabulary_id == vocab.id
        )
        .first()
    )

    if existing_link:
        return existing_link

    media_vocab_link = MediaVocabulary(
        media_id=media_id,
        vocabulary_id=vocab.id
    )

    db.add(media_vocab_link)
    db.commit()
    db.refresh(media_vocab_link)

    return media_vocab_link


def get_processing_chunks(media: Media) -> list[str]:
    """
    Returns media content split into chunks sized for map-reduce LLM
    processing (summarization, vocab extraction) instead of a single
    call over the entire extracted_content — needed since one call over
    a whole book can exceed a provider's context window.

    Epub: chapter boundaries from the file's spine are used as the
    primary split (a natural, semantically meaningful boundary); any
    chapter still too large on its own is further split. Every other
    format (TXT, SRT, PDF, DOCX, ODT) has no reliable structural
    boundary we can rely on, so the whole content goes straight through
    the generic character splitter.
    """
    if media.content_type == "application/epub+zip":
        chapters = extract_epub_chapters(get_media_disk_path(media))
        if chapters:
            chunks = []
            for chapter in chapters:
                if len(chapter) <= PROCESSING_CHUNK_SIZE:
                    chunks.append(chapter)
                else:
                    chunks.extend(split_for_processing(chapter))
            return chunks

    if not media.extracted_content:
        return []

    return split_for_processing(media.extracted_content)


def extract_and_save_vocabulary(db: Session, media: Media, provider, model) -> None:
    """
    Calls the LLM to extract vocabulary from a media item, chunk by
    chunk (see get_processing_chunks()), and persists each chunk's
    results to DB immediately after that chunk's call — not collected
    and written once at the end. This means:
    - progress is visible right away by just querying the vocab list,
      no separate status field needed
    - a failure partway through (or the process being killed) doesn't
      lose everything already extracted
    Dedup across chunks is already handled by get_or_create_vocab(), so
    repeated words across chunks are harmless.
    """
    chunks = get_processing_chunks(media)
    logger.info("Vocab extraction for media %s: %d chunk(s)", media.id, len(chunks))

    for i, chunk in enumerate(chunks, start=1):
        logger.info("Vocab extraction for media %s: chunk %d/%d started", media.id, i, len(chunks))

        system_prompt = build_vocab_extract_prompt(media, chunk)
        messages = [{"role": "user", "content": build_vocab_extract_user_message()}]

        response_structured = call_llm(
            messages=messages,
            system_prompt=system_prompt,
            provider=provider,
            model=model,
            temperature=0.2,
            response_schema=VocabularyExtraction
        )

        for item in response_structured.vocabularies:
            create_media_vocab(
                db,
                media.id,
                media.learning_id,
                item.word,
                item.translation,
                item.context_sentence,
                media.language_learning.learning_language
            )

        logger.info(
            "Vocab extraction for media %s: chunk %d/%d done (%d words)",
            media.id, i, len(chunks), len(response_structured.vocabularies),
        )

    logger.info("Vocab extraction for media %s: finished", media.id)


def run_vocabulary_extraction(media_id: UUID, provider: str | None, model: str | None) -> None:
    """
    BackgroundTask entry point wrapping extract_and_save_vocabulary().
    Opens its own DB session (rather than reusing the request's, which
    may already be torn down by the time a background task actually
    runs) and closes it when done. No status is persisted — progress is
    visible via the log lines in extract_and_save_vocabulary() and via
    the vocab list growing as each chunk is written.
    """
    db = SessionLocal()
    try:
        media = db.get(Media, media_id)
        if not media:
            logger.warning("Vocab extraction: media %s not found", media_id)
            return
        extract_and_save_vocabulary(db, media, provider, model)
    except Exception:
        logger.exception("Vocab extraction for media %s failed", media_id)
    finally:
        db.close()


def build_media_file_path(user_id: UUID, lan: str, media_id: UUID, ext: str) -> str:
    """Deterministic on-disk path for a medium's file, derived from its id.
    Never persisted — reconstructed on demand via get_media_disk_path()."""
    return os.path.join("uploads", str(user_id), lan, f"{media_id}{ext}")


def get_media_disk_path(media: Media) -> str:
    """Reconstructs a medium's on-disk file path from its id/extension
    plus its language_learning's user_id/learning_language."""
    learning = media.language_learning
    return build_media_file_path(learning.user_id, learning.learning_language, media.id, media.file_extension)


def save_uploaded_file(file: UploadFile, media_id: UUID, user_id: UUID, lan: str) -> str:
    """
    Saves an uploaded file to uploads/<user_id>/<lan>/<media_id><ext>.
    The filename is the Media's own id (generated by the caller before
    insert) plus the sanitized original extension — no separate UUID,
    and no user-supplied filename ever touches the path.
    Returns the file path.
    Raises HTTPException on write error.
    """
    ext = os.path.splitext(file.filename or "")[1].lower()
    ext = "".join(ch for ch in ext if ch.isalnum() or ch == ".")[:10]
    file_path = build_media_file_path(user_id, lan, media_id, ext)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Speichern der Datei: {str(e)}")

    return file_path


def sanitize_content_type(content_type: str | None) -> str:
    """Strips control characters (e.g. CR/LF) from a client-supplied MIME
    type before it's persisted. This value gets echoed back verbatim as
    the Content-Type response header on download, so it must never carry
    anything that could split/inject headers. No whitelist — the set of
    accepted content types changes independently of this."""
    if not content_type:
        return "application/octet-stream"
    return "".join(ch for ch in content_type if ch.isprintable()).strip()[:255] or "application/octet-stream"


def create_media_record(db: Session, media_id: UUID, title: str, file: UploadFile, file_path: str,
                        learning_id: int) -> Media:
    """Creates and persists a Media DB record. Only the extension (not the
    full disk path) plus the original filename are stored for reference;
    the disk path itself is derived on demand via get_media_disk_path()."""
    media = Media(
        id=media_id,
        title=title,
        content_type=sanitize_content_type(file.content_type),
        file_extension=os.path.splitext(file_path)[1],
        original_filename=file.filename,
        extracted_content=extract_content(file.content_type, file_path),
        learning_id=learning_id
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    return media


def embed_media_safe(db: Session, media: Media) -> None:
    """
    Embeds a medium's content for RAG. Runs as a BackgroundTask — failures
    are logged instead of silently swallowed, so a broken embedding
    provider is visible without blocking or breaking the upload itself.
    """
    try:
        embed_media(db, media)
    except Exception:
        logger.exception("Failed to embed media %s", media.id)


def _sample_excerpts(chunks: list[str], n: int = 4, excerpt_len: int = 400) -> list[str]:
    """Evenly-spaced raw excerpts across all chunks (not just first/last —
    that would miss register/vocabulary shifts in the middle of a work).
    A handful of short excerpts is enough for language/CEFR detection,
    unlike the summary which needs every chunk to avoid losing content."""
    if len(chunks) <= n:
        return [c[:excerpt_len] for c in chunks]
    step = len(chunks) / n
    indices = [int(i * step) for i in range(n)]
    return [chunks[i][:excerpt_len] for i in indices]


def _summarize_chunk(media_id: UUID, chunk: str, i: int, total: int) -> str:
    """'Map' step: a short mini-summary of a single chunk. Uses the
    default provider/model (call_llm's own fallback, e.g. via env config)
    rather than whatever the caller requested for the final reduce call —
    deliberately not hardcoded to a specific provider, since providers
    like Groq change their available models often enough that a
    hardcoded choice breaks silently and is hard to trace back."""
    logger.info("Metadata generation for media %s: chunk %d/%d started", media_id, i, total)
    summary = call_llm(
        messages=[{"role": "user", "content": chunk}],
        system_prompt=build_chunk_summary_prompt(),
        temperature=0.2,
    )
    logger.info("Metadata generation for media %s: chunk %d/%d done", media_id, i, total)
    return summary


def generate_media_metadata(media_id: UUID, provider: str | None = None, model: str | None = None) -> None:
    """
    Summarizes a medium's content via LLM and persists summary/topics/
    genre/difficulty_estimate. Runs as a BackgroundTask after upload, so
    it doesn't delay the upload response. Opens its own DB session
    rather than reusing the request's — see run_vocabulary_extraction()
    for why.

    For media that fit in a single processing chunk, this behaves
    exactly as before (one call, full text). For larger media it does a
    map-reduce instead of one call over the whole thing: a cheap/fast
    mini-summary per chunk (map, see _summarize_chunk), then a final
    call combining all mini-summaries plus a few sampled raw excerpts
    (reduce, see build_media_metadata_reduce_input) — that split is
    deliberate, see the docstring there for why summary and
    language/CEFR need different evidence.
    """
    db = SessionLocal()
    try:
        media = db.get(Media, media_id)
        if not media or not media.extracted_content:
            return

        chunks = get_processing_chunks(media)
        if not chunks:
            return

        logger.info("Metadata generation for media %s: %d chunk(s)", media_id, len(chunks))

        if len(chunks) == 1:
            message_content = chunks[0]
        else:
            chunk_summaries = [
                _summarize_chunk(media_id, chunk, i, len(chunks))
                for i, chunk in enumerate(chunks, start=1)
            ]
            raw_excerpts = _sample_excerpts(chunks)
            message_content = build_media_metadata_reduce_input(chunk_summaries, raw_excerpts)

        logger.info("Metadata generation for media %s: reduce call started", media_id)

        system_prompt = build_media_metadata_prompt(media)
        messages = [{"role": "user", "content": message_content}]

        result = call_llm(
            messages=messages,
            system_prompt=system_prompt,
            provider=provider,
            model=model,
            temperature=0.2,
            response_schema=MediaMetadataExtraction,
        )

        media.summary = result.summary
        media.topics = result.topics
        media.difficulty_estimate = result.difficulty_estimate
        media.genre = result.genre
        media.language = result.detected_language
        db.commit()

        logger.info("Metadata generation for media %s: finished", media_id)
    except Exception:
        logger.exception("Metadata generation for media %s failed", media_id)
    finally:
        db.close()
