from models import Chat, Media


def build_system_prompt_language_chat(chat: Chat, rag_context: str | None = None) -> str:
    """Build system prompt for language chat"""
    learning = chat.media.language_learning
    user = learning.user
    media = chat.media

    parts = [
        "Du bist ein Sprachlernassistent.",
        f"Die Muttersprache des Users ist: {user.native_language} (Sprachkürzel).",
        f"Der User lernt: {learning.learning_language} (Sprachkürzel) auf Niveau {learning.proficiency_level}.",
        "Antworte immer in der Lernsprache des Users, außer der User schreibt in der Muttersprache oder bittet dich explizit darum.",
    ]

    if media.summary:
        parts += [
            "",
            "Grober Kontext zum Medium, auf das sich dieses Gespräch bezieht:",
            f"Zusammenfassung: {media.summary}",
        ]
        if media.topics:
            parts.append(f"Themen: {', '.join(media.topics)}")
        if media.genre:
            parts.append(f"Art: {media.genre}")
        if media.difficulty_estimate:
            parts.append(f"Geschätztes Sprachniveau des Textes: {media.difficulty_estimate}")

    context = rag_context or chat.media.extracted_content
    if context:
        parts += [
            "",
            "Die folgenden Textausschnitte stammen aus dem Medium, auf das sich dieses Gespräch bezieht:",
            "---",
            context,
            "---",
        ]

    return "\n".join(parts)


def build_vocab_extract_prompt(media: Media) -> str:
    """Build system prompt for extracting vocabulary"""
    learning = media.language_learning
    user = learning.user

    parts = [
        "Du bist ein Sprachlernassistent und NLP-Experte für maschinelle Übersetzung und Vokabelextraktion.",
        f"Die Muttersprache des Users ist: {user.native_language} (Sprachkürzel).",
        f"Der User lernt: {learning.learning_language} (Sprachkürzel) auf Niveau {learning.proficiency_level}.",
        "Deine Aufgabe ist es, aus dem vom Nutzer bereitgestellten fremdsprachigen Text wichtige Schlüsselvokabeln (Nomen, Verben, Adjektive oder wichtige Redewendungen) zu extrahieren, die für einen Sprachlernenden relevant sind.",
        "Extrahiere nur Wörter, die tatsächlich im bereitgestellten Text vorkommen.",
        "Für Sprachen mit anderen Schriftsystemen (wie Japanisch): Schreibe das Wort in der üblichen Schreibweise (z. B. mit Kanji/Kana) und füge die Lesung/Umschrift (z. B. Romaji) in Klammern dahinter, z.B. '友達 (tomodachi)'."
    ]

    if media.extracted_content:
        parts += [
            "",
            "Der folgende Text ist das Medium, auf das sich dieses Gespräch bezieht:",
            "---",
            media.extracted_content,
            "---",
        ]

    return "\n".join(parts)


def build_media_metadata_prompt(media: Media) -> str:
    """Build system prompt for summarizing a medium and extracting metadata"""
    learning = media.language_learning

    return "\n".join([
        "Du bist ein Sprachlernassistent und fasst fremdsprachige Texte für Sprachlernende zusammen.",
        f"Der Text wurde für die Lernsprache {learning.learning_language} (Sprachkürzel) hochgeladen.",
        "Erkenne zunächst die tatsächliche Sprache des Textinhalts — das kann von der Lernsprache abweichen, "
        "falls der User versehentlich das falsche Medium hochgeladen hat.",
        "Fasse den Text kurz und knapp zusammen (2-4 Sätze) und nenne ein paar thematische Schlagworte.",
        "",
        "Schätze außerdem das Sprachniveau nach CEFR (A1-C2) ein, anhand dieser Kriterien:",
        "- A1/A2: einfache, kurze Hauptsätze, Alltagswortschatz, Präsens/einfache Vergangenheit, kaum Nebensätze",
        "- B1/B2: variablere Satzstrukturen, Nebensätze, abstraktere Themen, breiterer Wortschatz",
        "- C1/C2: komplexe Satzgefüge, idiomatische Wendungen, Fachvokabular, implizite Bedeutungen",
        "Bewerte streng nach dem, was tatsächlich im Text an Satzbau und Wortschatz vorkommt — nicht nach dem Thema.",
        "",
        "Schätze außerdem die Art/Gattung des Textes ein (z.B. Dialog, Nachrichtenartikel, Erzählung, Anleitung).",
    ])


def build_chat_title_prompt() -> str:
    """Build system prompt for generating a short chat title from the first message"""
    return (
        "Formuliere einen sehr kurzen, prägnanten Titel (max. 6 Wörter) für ein Gespräch. "
        "Du bekommst den Titel und ggf. eine Zusammenfassung des Mediums, um das es geht, sowie "
        "die erste Nachricht des Users. Orientiere dich am Thema des Mediums, nicht nur an der "
        "Formulierung der ersten Nachricht — bei einer reinen Begrüßung wie 'Hallo!' den Titel "
        "stattdessen aus dem Medienkontext ableiten. "
        "Antworte nur mit dem Titel selbst, ohne Anführungszeichen, ohne Punkt am Ende."
    )
