/**
 * Dengwa stores the learning language as free text — whatever the user
 * typed when creating it (e.g. "Spanisch", "Spanish", "es", "Español").
 * The Web Speech API needs a BCP-47 tag (e.g. "es-ES") to pick the right
 * recognizer/voice. This maps the common spellings we'd expect for the
 * languages Dengwa is actually used for to a reasonable BCP-47 tag.
 *
 * Best-effort by design: unmapped input is returned unchanged, which most
 * engines will just ignore in favor of their own default rather than error.
 */
const LANGUAGE_ALIASES: Record<string, string> = {
    spanisch: 'es-ES', español: 'es-ES', espanol: 'es-ES', spanish: 'es-ES', es: 'es-ES',
    englisch: 'en-US', english: 'en-US', en: 'en-US',
    deutsch: 'de-DE', german: 'de-DE', de: 'de-DE',
    französisch: 'fr-FR', franzoesisch: 'fr-FR', french: 'fr-FR', français: 'fr-FR', fr: 'fr-FR',
    italienisch: 'it-IT', italian: 'it-IT', italiano: 'it-IT', it: 'it-IT',
    portugiesisch: 'pt-PT', portuguese: 'pt-PT', português: 'pt-PT', pt: 'pt-PT',
    japanisch: 'ja-JP', japanese: 'ja-JP', ja: 'ja-JP',
    chinesisch: 'zh-CN', chinese: 'zh-CN', mandarin: 'zh-CN', zh: 'zh-CN',
    koreanisch: 'ko-KR', korean: 'ko-KR', ko: 'ko-KR',
    russisch: 'ru-RU', russian: 'ru-RU', ru: 'ru-RU',
    niederländisch: 'nl-NL', dutch: 'nl-NL', nl: 'nl-NL',
    polnisch: 'pl-PL', polish: 'pl-PL', pl: 'pl-PL',
    türkisch: 'tr-TR', turkish: 'tr-TR', tr: 'tr-TR',
    griechisch: 'el-GR', greek: 'el-GR', el: 'el-GR',
    schwedisch: 'sv-SE', swedish: 'sv-SE', sv: 'sv-SE',
    arabisch: 'ar-SA', arabic: 'ar-SA', ar: 'ar-SA',
    hindi: 'hi-IN', hi: 'hi-IN',
}

export function toBcp47(learningLanguage: string): string {
    const key = learningLanguage.trim().toLowerCase()
    return LANGUAGE_ALIASES[key] ?? learningLanguage
}