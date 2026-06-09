from models import Chat


def build_system_prompt_language_chat(chat: Chat) -> str:
    """Build system prompt for language chat"""
    learning = chat.media.language_learning
    user = learning.user

    parts = [
        "Du bist ein Sprachlernassistent.",
        f"Die Muttersprache des Users ist: {user.native_language}.",
        f"Der User lernt: {learning.learning_language} auf Niveau {learning.proficiency_level}.",
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
