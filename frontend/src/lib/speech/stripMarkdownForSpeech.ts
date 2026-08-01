/**
 * Strips common Markdown syntax so TTS engines don't read out symbols
 * like "asterisk" or "hashtag". Deliberately simple/regex-based — good
 * enough for LLM-generated chat replies, not a full Markdown parser.
 */
export function stripMarkdownForSpeech(markdown: string): string {
    return markdown
        .replace(/```[\s\S]*?```/g, '') // fenced code blocks
        .replace(/`([^`]+)`/g, '$1') // inline code
        .replace(/!\[[^\]]*]\([^)]*\)/g, '') // images
        .replace(/\[([^\]]+)]\([^)]*\)/g, '$1') // links -> link text only
        .replace(/^#{1,6}\s+/gm, '') // headers
        .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
        .replace(/(\*|_)(.*?)\1/g, '$2') // italic
        .replace(/^>\s?/gm, '') // blockquotes
        .replace(/^[-*+]\s+/gm, '') // list bullets
        .replace(/\n{2,}/g, '. ') // paragraph breaks -> a pause
        .trim()
}