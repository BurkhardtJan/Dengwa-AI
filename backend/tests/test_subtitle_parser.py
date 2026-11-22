"""Unit tests for subtitle text extraction. No server needed (unlike test_api.py)."""
from services.subtitle_parser import (
    decode_subtitle_bytes, normalize_language, pick_source_language, subtitle_to_text,
)

SRT = """1
00:00:01,000 --> 00:00:02,500
Hola, ¿qué tal?

2
00:00:03,000 --> 00:00:05,000
<i>Muy bien,</i>
gracias.
"""

VTT = """WEBVTT

NOTE this is a comment

STYLE
::cue { color: red }

intro
00:01.000 --> 00:02.500 align:start
<v Ana>Hola &amp; adiós</v>

00:00:03.000 --> 00:00:05.000
{\\an8}Segunda línea
"""

LRC = """[ti:Canción]
[ar:Alguien]
[00:12.50]Primera línea
[00:15.00]<00:15.00>Segunda <00:16.00>línea
[00:20.00]
"""


def test_srt_cues_become_plain_lines():
    assert subtitle_to_text(SRT) == "Hola, ¿qué tal?\nMuy bien, gracias."


def test_vtt_skips_header_notes_styles_and_cue_ids():
    assert subtitle_to_text(VTT) == "Hola & adiós\nSegunda línea"


def test_lrc_skips_metadata_and_timestamps():
    assert subtitle_to_text(LRC) == "Primera línea\nSegunda línea"


def test_windows_line_endings_and_bom():
    assert subtitle_to_text("\ufeff" + SRT.replace("\n", "\r\n")) == "Hola, ¿qué tal?\nMuy bien, gracias."


def test_missing_blank_line_between_cues_does_not_leak_cue_numbers():
    raw = "1\n00:00:01,000 --> 00:00:02,000\nUno\n2\n00:00:03,000 --> 00:00:04,000\nDos\n"
    assert subtitle_to_text(raw) == "Uno\nDos"


def test_consecutive_duplicate_lines_are_dropped():
    raw = ("00:00:01.000 --> 00:00:02.000\nHola\n\n"
           "00:00:02.000 --> 00:00:03.000\nHola\n\n"
           "00:00:03.000 --> 00:00:04.000\nAdiós\n")
    assert subtitle_to_text(raw) == "Hola\nAdiós"


def test_text_without_any_cues_returns_empty_string():
    assert subtitle_to_text("just some words\nwithout timing") == ""
    assert subtitle_to_text("") == ""


def test_decode_prefers_utf8_and_falls_back_to_latin1():
    assert decode_subtitle_bytes("¿qué?".encode("utf-8")) == "¿qué?"
    assert decode_subtitle_bytes("¿qué?".encode("latin-1")) == "¿qué?"
    assert decode_subtitle_bytes(b"\xef\xbb\xbfhola") == "hola"


def test_normalize_language():
    assert normalize_language(" ES ") == "es"
    assert normalize_language("pt-BR") == "pt-br"
    assert normalize_language("Spanish") is None
    assert normalize_language("") is None
    assert normalize_language(None) is None


def test_source_is_track_in_medium_language():
    assert pick_source_language(["de", "es", "fr"], "es") == "es"


def test_source_prefers_exact_match_over_regional_variant():
    assert pick_source_language(["es-mx", "es"], "es") == "es"


def test_source_matches_primary_language_subtag():
    assert pick_source_language(["es-mx"], "es") == "es-mx"
    assert pick_source_language(["es"], "es-MX") == "es"


def test_no_source_without_track_in_medium_language():
    assert pick_source_language(["de"], "es") is None
    assert pick_source_language([], "es") is None
    assert pick_source_language(["es"], None) is None
