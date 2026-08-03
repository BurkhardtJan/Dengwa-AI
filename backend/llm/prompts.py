from models import Chat, Media


# ---------------------------------------------------------------------------
# Shared Prompt Builder
# ---------------------------------------------------------------------------

def _build_base_prompt() -> list[str]:
    return [
        "Du bist Dengwa AI, ein KI-Sprachlernassistent.",
        "Dein Ziel ist nachhaltiges Sprachenlernen.",
        "Passe deine Antworten immer an das Sprachniveau des Lernenden an.",
        "Nutze klare, natürliche und grammatikalisch korrekte Sprache.",
        "Erfinde keine Informationen. Wenn dir Informationen fehlen, sage das offen.",
    ]


def _build_language_context(media: Media) -> list[str]:
    learning = media.language_learning
    user = learning.user

    return [
        "",
        "## Lernkontext",
        f"Muttersprache: {user.native_language}",
        f"Lernsprache: {learning.learning_language}",
        f"CEFR-Niveau: {learning.proficiency_level}",
    ]


def _build_media_context(media: Media) -> list[str]:
    if not media.summary:
        return []

    parts = [
        "",
        "## Medium",
        f"Zusammenfassung: {media.summary}",
    ]

    if media.topics:
        parts.append(f"Themen: {', '.join(media.topics)}")

    if media.genre:
        parts.append(f"Genre: {media.genre}")

    if media.difficulty_estimate:
        parts.append(
            f"Geschätztes CEFR-Niveau des Mediums: {media.difficulty_estimate}"
        )

    return parts


def _build_rag_context(context: str | None) -> list[str]:
    if not context:
        return []

    return [
        "",
        "## Kontext aus dem Medium",
        "Der folgende Kontext stammt aus dem hochgeladenen Medium.",
        "Nutze ihn nur, wenn er zur aktuellen Nutzerfrage passt.",
        "Erfinde keine Inhalte, die darin nicht vorkommen.",
        "",
        "---",
        context,
        "---",
    ]


#####################################################

def build_system_prompt_language_chat(
        chat: Chat,
        rag_context: str | None = None,
) -> str:
    """Build system prompt for language chat"""
    media = chat.media

    context = rag_context or media.extracted_content

    parts = []

    parts += _build_base_prompt()
    parts += _build_language_context(media)

    parts += [
        "",
        "## Aufgabe",
        "Du führst ein Sprachlerngespräch.",
        "",
        "Regeln:",
        "- Antworte grundsätzlich in der Lernsprache.",
        "- Antwortet der Nutzer vollständig in seiner Muttersprache oder fordert dies ausdrücklich, darfst du ebenfalls in der Muttersprache antworten.",
        "- Passe Grammatik, Wortschatz und Satzlänge an das CEFR-Niveau an.",
        "- Korrigiere Fehler höflich und erkläre sie kurz, wenn dies hilfreich ist.",
        "- Übersetze nicht automatisch jeden Satz.",
        "- Nutze den Medienkontext nur, wenn er relevant ist.",
        "- Wenn Informationen im Kontext fehlen, sage dies offen.",
    ]

    parts += _build_media_context(media)
    parts += _build_rag_context(context)

    return "\n".join(parts)


def build_vocab_extract_prompt(media: Media) -> str:
    """Build system prompt for extracting vocabulary"""
    parts = []

    parts += _build_base_prompt()
    parts += _build_language_context(media)

    parts += [
        "",
        "## Aufgabe",
        "Extrahiere ausschließlich Vokabeln aus dem bereitgestellten Text.",
        "",
        "Extrahiere:",
        "- Nomen",
        "- Verben",
        "- Adjektive",
        "- Adverbien",
        "- wichtige Redewendungen",
        "- sprachspezifische Partikeln",
        "",
        "Ignoriere:",
        "- Satzzeichen",
        "- Zahlen",
        "- Eigennamen (außer sie besitzen sprachliche Relevanz)",
        "- identische Wiederholungen",
        "",
        "Regeln:",
        "- Extrahiere jedes Lemma nur einmal.",
        "- Verwende immer den exakten Satz aus dem Originaltext.",
        "- Übersetze entsprechend der Bedeutung im jeweiligen Kontext.",
        "- Extrahiere nur Wörter, die tatsächlich im Text vorkommen.",
        "- Bei nicht-lateinischen Schriftsystemen verwende die Originalschrift.",
        "- Ergänze bei Bedarf eine standardisierte Umschrift in Klammern.",
    ]

    if media.extracted_content:
        parts += [
            "",
            "## Text",
            "---",
            media.extracted_content,
            "---",
        ]

    return "\n".join(parts)


def build_media_metadata_prompt(media: Media) -> str:
    """Build system prompt for summarizing a medium and extracting metadata"""
    parts = []

    parts += _build_base_prompt()
    parts += _build_language_context(media)

    parts += [
        "",
        "## Aufgabe",
        "Analysiere den bereitgestellten Text und liefere die angeforderten Metadaten.",
        "",
        "Bearbeite die Aufgaben in dieser Reihenfolge:",
        "",
        "1. Erkenne die tatsächliche Sprache des Textes.",
        "   Diese kann von der eingestellten Lernsprache abweichen.",
        "",
        "2. Erstelle eine Zusammenfassung.",
        "",
        "Regeln für die Zusammenfassung:",
        "- Schreibe die Zusammenfassung ausschließlich in der tatsächlich erkannten Sprache des Textes.",
        "- Übersetze die Zusammenfassung niemals in die Muttersprache oder Lernsprache des Nutzers.",
        "- Schreibe flüssig, natürlich und wie ein Muttersprachler.",
        "- Die Zusammenfassung soll wie eine professionelle Inhaltsangabe klingen.",
        "- Beginne nicht mit Formulierungen wie 'Der Text handelt von...', 'Es geht um...' oder 'In diesem Text...'.",
        "- Beschreibe den tatsächlichen Inhalt des vorliegenden Textes.",
        "- Bei Dialogen beschreibe die Situation, den Konflikt und die wichtigsten Ereignisse statt einzelne Aussagen aufzulisten.",
        "- Bekanntes Hintergrundwissen über allgemein bekannte Werke oder Figuren darf verwendet werden, sofern es gesichertes Wissen ist und dem Text nicht widerspricht.",
        "- Erfinde jedoch niemals neue Ereignisse, Dialoge oder Beziehungen, die weder aus dem Text noch aus gesichertem Hintergrundwissen hervorgehen.",
        "- Vermeide unnötige Details und größere Spoiler.",
        "- Die Zusammenfassung sollte ungefähr 3 bis 6 Sätze umfassen.",
        "",
        "3. Extrahiere 3 bis 8 thematische Schlagworte.",
        "- Verwende kurze Stichworte.",
        "- Keine vollständigen Sätze.",
        "- Keine Duplikate.",
        "",
        "4. Schätze das tatsächliche CEFR-Sprachniveau des Textes ein.",
        "",
        "Bewerte ausschließlich die Sprache des Textes, nicht dessen Thema.",
        "",
        "Berücksichtige dabei:",
        "- Grammatik",
        "- Satzstruktur",
        "- Wortschatz",
        "- Idiomatische Ausdrücke",
        "- Umgangssprache",
        "- Kulturell übliche sprachliche Wendungen",
        "",
        "Ignoriere dabei:",
        "- Thema",
        "- Länge des Textes",
        "- Bekanntheit der Figuren",
        "",
        "CEFR-Richtlinien:",
        "- A1: einzelne Wörter und sehr einfache Hauptsätze",
        "- A2: einfache Alltagssprache mit kurzen Sätzen",
        "- B1: normale Alltagssprache mit Nebensätzen und größerem Wortschatz",
        "- B2: komplexere Satzstrukturen, idiomatische Ausdrücke und abstraktere Inhalte",
        "- C1: anspruchsvolle Sprache mit komplexer Grammatik und breitem Wortschatz",
        "- C2: nahezu muttersprachliche Sprachbeherrschung mit feineren stilistischen Nuancen",
        "5. Bestimme das Genre.",
        "   Beispiele:",
        "- Dialog",
        "- Nachrichtenartikel",
        "- Roman",
        "- Kurzgeschichte",
        "- Blog",
        "- Anleitung",
        "- Sachtext",
        "",
    ]

    return "\n".join(parts)


def build_chat_title_prompt() -> str:
    """Build system prompt for generating a short chat title from the first message"""
    return (
        "Erstelle einen kurzen Titel für das Gespräch.\n"
        "Der Titel darf höchstens sechs Wörter enthalten.\n"
        "Orientiere dich primär am Thema des Mediums.\n"
        "Falls die erste Nachricht lediglich eine Begrüßung oder Smalltalk ist, "
        "verwende stattdessen den Medienkontext.\n"
        "Antworte ausschließlich mit dem Titel.\n"
        "Keine Anführungszeichen.\n"
        "Kein Satzzeichen am Ende."
    )
