import os

OCTET_STREAM_EXTENSIONS = {".txt", ".srt", ".vtt", ".md"}

"""
TODO:
pdf
epub
docx
odt
image
"""


def read_text_file(file_path: str) -> str:
    """Helper function to read text file"""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except UnicodeDecodeError:
        with open(file_path, "r", encoding="latin-1") as f:
            return f.read()


def extract_content(content_type: str, file_path: str) -> str | None:
    """Helper function to extract content from files"""
    if content_type.startswith("text/"):
        return read_text_file(file_path)

    if content_type == "application/x-subrip":
        return read_text_file(file_path)

    if content_type == "application/octet-stream":
        ext = os.path.splitext(file_path)[1].lower()
        if ext in OCTET_STREAM_EXTENSIONS:
            return read_text_file(file_path)

    return None
