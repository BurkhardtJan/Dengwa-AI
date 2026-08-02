/**
 * ISO 639-1 language codes and a browser-native way to display them.
 *
 * Source for the full list: the "language-codes" dataset on datahub.io
 * (Public Domain / PDDL), itself sourced from the Library of Congress
 * (ISO 639-2 Registration Authority) and Unicode CLDR. 184 codes.
 * https://datahub.io/core/language-codes
 */

/** Quick-pick shortlist shown by default. Extend freely — this is a starting point, not a hard limit. */
export const CURATED_LANGUAGE_CODES = [
    'de', 'en', 'es', 'fr', 'it', 'pt', 'nl', 'sv', 'da', 'fi',
    'pl', 'cs', 'ro', 'hu', 'el', 'ru', 'uk', 'tr',
    'ar', 'he', 'hi',
    'ja', 'zh', 'ko', 'th', 'vi', 'id',
] as const

/** Full ISO 639-1 list, for the "all languages" picker. */
export const ISO_639_1_CODES = [
    'aa', 'ab', 'ae', 'af', 'ak', 'am', 'an', 'ar', 'as', 'av',
    'ay', 'az', 'ba', 'be', 'bg', 'bi', 'bm', 'bn', 'bo', 'br',
    'bs', 'ca', 'ce', 'ch', 'co', 'cr', 'cs', 'cu', 'cv', 'cy',
    'da', 'de', 'dv', 'dz', 'ee', 'el', 'en', 'eo', 'es', 'et',
    'eu', 'fa', 'ff', 'fi', 'fj', 'fo', 'fr', 'fy', 'ga', 'gd',
    'gl', 'gn', 'gu', 'gv', 'ha', 'he', 'hi', 'ho', 'hr', 'ht',
    'hu', 'hy', 'hz', 'ia', 'id', 'ie', 'ig', 'ii', 'ik', 'io',
    'is', 'it', 'iu', 'ja', 'jv', 'ka', 'kg', 'ki', 'kj', 'kk',
    'kl', 'km', 'kn', 'ko', 'kr', 'ks', 'ku', 'kv', 'kw', 'ky',
    'la', 'lb', 'lg', 'li', 'ln', 'lo', 'lt', 'lu', 'lv', 'mg',
    'mh', 'mi', 'mk', 'ml', 'mn', 'mr', 'ms', 'mt', 'my', 'na',
    'nb', 'nd', 'ne', 'ng', 'nl', 'nn', 'no', 'nr', 'nv', 'ny',
    'oc', 'oj', 'om', 'or', 'os', 'pa', 'pi', 'pl', 'ps', 'pt',
    'qu', 'rm', 'rn', 'ro', 'ru', 'rw', 'sa', 'sc', 'sd', 'se',
    'sg', 'si', 'sk', 'sl', 'sm', 'sn', 'so', 'sq', 'sr', 'ss',
    'st', 'su', 'sv', 'sw', 'ta', 'te', 'tg', 'th', 'ti', 'tk',
    'tl', 'tn', 'to', 'tr', 'ts', 'tt', 'tw', 'ty', 'ug', 'uk',
    'ur', 'uz', 've', 'vi', 'vo', 'wa', 'wo', 'xh', 'yi', 'yo',
    'za', 'zh', 'zu',
] as const

/**
 * Display name for a language code, localized to uiLocale, via the
 * browser-native Intl.DisplayNames — no data file to maintain.
 *
 * Falls back to returning the input unchanged if it isn't a
 * structurally valid BCP-47 subtag (Intl.DisplayNames.of() throws a
 * RangeError in that case, e.g. for free-text entries like "Schweizerdeutsch"
 * or anything containing spaces) — this is the deliberate escape hatch
 * for the free-text exception, not just defensive coding.
 */
export function getLanguageDisplayName(code: string, uiLocale: string): string {
    try {
        const displayNames = new Intl.DisplayNames([uiLocale], {type: 'language'})
        return displayNames.of(code) ?? code
    } catch {
        return code
    }
}