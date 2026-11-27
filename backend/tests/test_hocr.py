"""Unit tests for the hOCR check. No server needed (unlike test_api.py)."""
from services.hocr import hocr_to_text, looks_like_hocr

HOCR = b"""<?xml version="1.0" encoding="UTF-8"?>
<html><body>
<div class='ocr_page' id='page_1' title='image "page1.png"; bbox 0 0 800 1200; ppageno 0'>
 <span class='ocr_line' title='bbox 10 10 200 40'><span class='ocrx_word' title='bbox 10 10 90 40; x_wconf 91'>Bonjour</span></span>
</div></body></html>"""


def test_hocr_from_tesseract_is_accepted():
    assert looks_like_hocr(HOCR)


def test_hocr_with_only_paragraphs_is_accepted():
    assert looks_like_hocr(b"<div class='ocr_page'><p class='ocr_par'>text</p></div>")


def test_other_html_is_rejected():
    assert not looks_like_hocr(b"<html><body><p>Hello</p></body></html>")


def test_page_without_text_structure_is_rejected():
    assert not looks_like_hocr(b"<div class='ocr_page'></div>")


def test_binary_and_empty_data_are_rejected():
    assert not looks_like_hocr(b"\x89PNG\r\n\x1a\n\x00\x00")
    assert not looks_like_hocr(b"")


PAGES = b"""<html><body>
<div class='ocr_page' title='image "p1.png"; bbox 0 0 800 1200'>
 <div class='ocr_carea'>
  <p class='ocr_par'>
   <span class='ocr_line' title='bbox 10 10 200 40'><span class='ocrx_word'>Bonjour</span> <span class='ocrx_word'>le</span></span>
   <span class='ocr_line' title='bbox 10 50 200 80'><span class='ocrx_word'>monde</span><span class='ocrx_word'>&amp; toi</span></span>
  </p>
  <p class='ocr_par'><span class='ocr_line'><span class='ocrx_word'>Salut</span></span></p>
 </div>
 <div class='ocr_photo' title='bbox 0 0 10 10'></div>
</div>
<div class='ocr_page' title='image "p2.png"; bbox 0 0 800 1200'></div>
<div class='ocr_page' title='image "p3.png"; bbox 0 0 800 1200'>
 <span class='ocr_caption'>Pas de mots<br/>ici</span>
 <p class='ocr_par'><span class='ocrx_word'>direct</span></p>
</div>
</body></html>"""


def test_text_has_one_paragraph_per_line_and_a_blank_line_between_pages():
    assert hocr_to_text(PAGES) == "Bonjour le monde & toi\nSalut\n\nPas de mots ici\ndirect"


def test_pages_without_text_are_skipped():
    assert hocr_to_text(PAGES).count("\n\n") == 1


def test_text_of_empty_or_textless_hocr_is_empty():
    assert hocr_to_text(b"") == ""
    assert hocr_to_text(b"<div class='ocr_page'><div class='ocr_photo'></div></div>") == ""


def test_unclosed_and_stray_tags_do_not_lose_text():
    raw = b"<div class='ocr_page'></span><span class='ocr_line'><span class='ocrx_word'>Hola<br><span class='ocrx_word'>mundo</span></span></div>"
    assert hocr_to_text(raw) == "Hola mundo"
