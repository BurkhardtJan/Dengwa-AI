"""Plain-text extraction from subtitle files (SRT, WebVTT, LRC).

Pure functions without project imports, so they can be unit-tested without
a database or a running server.
"""
import html
import re
from typing import Iterable, Iterator, Optional

SUPPORTED_EXTENSIONS = (".srt", ".vtt", ".lrc")

# "00:01:02,500 --> 00:01:04,000" (SRT) or "01:02.500 --> 01:04.000" (WebVTT, hours optional)
_TIMING = re.compile(r"(?:\d+:)?\d{1,2}:\d{2}[.,]\d{1,3}\s*-->\s*(?:\d+:)?\d{1,2}:\d{2}[.,]\d{1,3}")
# HTML-like tags (<i>, <v Speaker>, <c.yellow>, <00:01:02.500>) and ASS override tags ({\an8})
_MARKUP = re.compile(r"</?[A-Za-z][^>]*>|<\d{1,2}:\d{2}[.,:]\d{1,3}>|\{\\[^}]*\}")
# LRC: line timestamps "[01:02.50]" and enhanced word timestamps "<01:02.50>"
_LRC_TIME = re.compile(r"\[\d{1,3}:\d{2}(?:[.:]\d{1,3})?\]|<\d{1,3}:\d{2}(?:[.:]\d{1,3})?>")
# LRC metadata such as "[ti:Title]" or "[ar:Artist]"
# Only line timestamps count for detecting LRC; plain text without any timing is not a subtitle file
_LRC_LINE_TIME = re.compile(r"\[\d{1,3}:\d{2}(?:[.:]\d{1,3})?\]")
_LRC_META = re.compile(r"^\s*\[[A-Za-z]+:[^\]]*\]\s*$")
_LANGUAGE = re.compile(r"^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$")


def decode_subtitle_bytes(data: bytes) -> str:
    """UTF-8 (with or without BOM), falling back to latin-1 like the rest of the
    backend (see read_text_file). Other legacy encodings are not detected."""
    try:
        return data.decode("utf-8-sig")
    except UnicodeDecodeError:
        return data.decode("latin-1")


def _clean(line: str) -> str:
    line = _MARKUP.sub("", line)
    return " ".join(html.unescape(line).split())


def _cue_lines(lines: list[str]) -> Iterator[str]:
    """One text line per SRT/WebVTT cue (multi-line cues are joined with a space); cue numbers,
    timings, headers and NOTE/STYLE blocks are skipped."""
    in_cue = False
    cue: list[str] = []
    for i, line in enumerate(lines):
        if _TIMING.search(line):
            if cue:
                yield " ".join(cue)
            in_cue, cue = True, []
            continue
        if not line.strip():
            if cue:
                yield " ".join(cue)
            in_cue, cue = False, []
            continue
        if not in_cue:
            continue
        # A cue number directly before the next timing line (blank line missing between cues)
        if line.strip().isdigit() and i + 1 < len(lines) and _TIMING.search(lines[i + 1]):
            if cue:
                yield " ".join(cue)
            in_cue, cue = False, []
            continue
        text = _clean(line)
        if text:
            cue.append(text)
    if cue:
        yield " ".join(cue)


def _lrc_lines(lines: list[str]) -> Iterator[str]:
    for line in lines:
        if _LRC_META.match(line):
            continue
        text = _clean(_LRC_TIME.sub("", line))
        if text:
            yield text


def subtitle_to_text(raw: str) -> str:
    """Converts SRT, WebVTT or LRC content to plain text, one cue (line) per line.

    The format is detected from the content (a "-->" timing line means SRT/WebVTT,
    a "[mm:ss]" tag means LRC), not from the file extension. Consecutive duplicate
    lines are dropped, because roll-up captions repeat the previous line.
    Returns "" if no text was found.
    """
    lines = raw.lstrip("\ufeff").replace("\r\n", "\n").replace("\r", "\n").split("\n")
    if any(_TIMING.search(line) for line in lines):
        source = _cue_lines(lines)
    elif any(_LRC_LINE_TIME.search(line) for line in lines):
        source = _lrc_lines(lines)
    else:
        return ""

    result: list[str] = []
    for text in source:
        if not result or result[-1] != text:
            result.append(text)
    return "\n".join(result)


def normalize_language(language: Optional[str]) -> Optional[str]:
    """Lower-cased language code (e.g. "es", "pt-BR" -> "pt-br"), or None if it isn't one."""
    if language is None:
        return None
    language = language.strip()
    if not _LANGUAGE.match(language):
        return None
    return language.lower()


def _primary_subtag(language: Optional[str]) -> str:
    return (language or "").strip().lower().split("-")[0]


def pick_source_language(languages: Iterable[str], medium_language: Optional[str]) -> Optional[str]:
    """Which of a medium's subtitle languages feeds its extracted text: the one matching the
    medium's language. An exact match wins ("es" for "es"); otherwise the first match on the
    primary subtag in alphabetical order ("es-mx" counts as "es"). Tracks in other languages
    are display-only. Returns None if no track fits."""
    wanted = (medium_language or "").strip().lower()
    candidates = sorted(language.lower() for language in languages)
    if wanted in candidates:
        return wanted
    return next((c for c in candidates if _primary_subtag(c) == _primary_subtag(wanted)), None)
