"""Pure helpers for hOCR files (the HTML format of Tesseract and the Internet Archive),
without project imports so they can be unit-tested without a database."""
from html.parser import HTMLParser

# Class names that hOCR uses for its structure
_STRUCTURE_MARKERS = ("ocr_line", "ocrx_line", "ocrx_word", "ocr_par", "ocr_carea")

_KIND_BY_CLASS = {
    "ocr_page": "page",
    "ocr_par": "par",
    "ocr_line": "line", "ocrx_line": "line", "ocr_caption": "line", "ocr_header": "line", "ocr_textfloat": "line",
    "ocrx_word": "word", "ocr_word": "word",
}
_VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}


def looks_like_hocr(data: bytes) -> bool:
    """Rough check that a file is hOCR: it has pages and some text structure.
    The viewer reads the details; this only keeps obviously wrong files out."""
    text = data.decode("utf-8", errors="ignore")
    return "ocr_page" in text and any(marker in text for marker in _STRUCTURE_MARKERS)


def _normalize(text: str) -> str:
    return " ".join(text.split())


class _HocrTextParser(HTMLParser):
    """Streams through hOCR and collects one text per paragraph (lines of a paragraph joined
    by a space), like the viewer does for a selection. Lines outside a paragraph count as a
    paragraph of their own; photos and separators have no text and give nothing."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.pages: list[list[str]] = []
        self._stack: list[tuple[str, str]] = []  # (tag, kind) of the open elements
        self._page: list[str] = []  # paragraphs outside any ocr_page end up here as well
        self._par: list[str] | None = None
        self._line: list[str] | None = None  # words of the open line
        self._line_free: list[str] = []  # text of a line that has no word elements
        self._word: list[str] | None = None

    def handle_starttag(self, tag, attrs):
        if tag in _VOID_TAGS:
            if tag == "br":
                self._add_space()
            return
        classes = (dict(attrs).get("class") or "").split()
        kind = next((_KIND_BY_CLASS[c] for c in classes if c in _KIND_BY_CLASS), "")
        self._stack.append((tag, kind))
        # An element of the same kind that was never closed ends here
        if (kind == "par" and self._par is not None) or (kind == "line" and self._line is not None) \
                or (kind == "word" and self._word is not None):
            self._close(kind)
        if kind == "page":
            self._finish_page()
        elif kind == "par":
            self._par = []
        elif kind == "line":
            self._line, self._line_free = [], []
        elif kind == "word":
            self._word = []

    def handle_startendtag(self, tag, attrs):
        if tag == "br":
            self._add_space()  # <span ... /> and other self-closed tags have no content

    def _add_space(self) -> None:
        if self._word is not None:
            self._word.append(" ")
        elif self._line is not None:
            self._line_free.append(" ")

    def handle_endtag(self, tag):
        if tag in _VOID_TAGS:
            return
        # Close the matching element (and anything left open inside it); stray end tags are ignored
        for i in range(len(self._stack) - 1, -1, -1):
            if self._stack[i][0] == tag:
                kinds = [kind for _, kind in self._stack[i:]]
                del self._stack[i:]
                for kind in reversed(kinds):  # elements left open inside it end with it
                    self._close(kind)
                return

    def handle_data(self, data):
        if self._word is not None:
            self._word.append(data)
        elif self._line is not None:
            self._line_free.append(data)

    def _close(self, kind: str) -> None:
        if kind == "word":
            text = _normalize("".join(self._word or []))
            self._word = None
            if text:
                if self._line is not None:
                    self._line.append(text)
                elif self._par is not None:
                    self._par.append(text)
                else:
                    self._page.append(text)
        elif kind == "line":
            text = " ".join(self._line or []) or _normalize("".join(self._line_free))
            self._line, self._line_free = None, []
            if text:
                (self._par if self._par is not None else self._page).append(text)
        elif kind == "par":
            text = " ".join(self._par or [])
            self._par = None
            if text:
                self._page.append(text)
        elif kind == "page":
            self._finish_page()

    def _finish_page(self) -> None:
        if self._page:
            self.pages.append(self._page)
        self._page = []

    def finish(self) -> list[list[str]]:
        self.close()
        self._finish_page()
        return self.pages


def hocr_to_text(data: bytes) -> str:
    """Plain text of an hOCR file: one paragraph per line, a blank line between pages.
    Returns "" if there is no text."""
    parser = _HocrTextParser()
    parser.feed(data.decode("utf-8", errors="replace"))
    pages = parser.finish()
    return "\n\n".join("\n".join(paragraphs) for paragraphs in pages)
