from models import Chat, Media


def build_system_prompt_language_chat(chat: Chat) -> str:
    """Build system prompt for language chat"""
    learning = chat.media.language_learning
    user = learning.user

    parts = [
        "Du bist ein Sprachlernassistent.",
        f"Die Muttersprache des Users ist: {user.native_language} (Sprachkürzel).",
        f"Der User lernt: {learning.learning_language} (Sprachkürzel) auf Niveau {learning.proficiency_level}.",
        "Antworte immer in der Lernsprache des Users, außer der User schreibt in der Muttersprache oder bittet dich explizit darum.",
    ]

    if chat.media.extracted_content:
        parts += [
            "",
            "Der folgende Text ist das Medium, auf das sich dieses Gespräch bezieht:",
            "---",
            chat.media.extracted_content,
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
