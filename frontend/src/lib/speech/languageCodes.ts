/**
 * Converts a bare BCP-47 language subtag (e.g. "es") to a fuller tag with
 * region (e.g. "es-ES"), using the browser-native Intl.Locale "Add Likely
 * Subtags" algorithm — backed by real Unicode CLDR data, covers all ISO
 * 639-1 codes automatically, no hand-maintained table.
 *
 * Deliberately built from .language/.region rather than .baseName:
 * maximize().baseName includes the script subtag (e.g. "es-Latn-ES"), which
 * real SpeechSynthesis voices' .lang values almost never carry (they're
 * "es-ES", not "es-Latn-ES") — including it would break voice matching.
 *
 * Falls back to returning the input unchanged for anything that isn't a
 * structurally valid BCP-47 subtag (Intl.Locale throws a RangeError in that
 * case) — this is the deliberate fallback for the free-text exception
 * (e.g. "Schweizerdeutsch"), not just defensive coding. Most speech engines
 * just ignore an unrecognized tag and fall back to their own default rather
 * than error.
 */
export function toBcp47(learningLanguage: string): string {
    try {
        const maximized = new Intl.Locale(learningLanguage.trim()).maximize()
        return maximized.region ? `${maximized.language}-${maximized.region}` : maximized.language
    } catch {
        return learningLanguage
    }
}