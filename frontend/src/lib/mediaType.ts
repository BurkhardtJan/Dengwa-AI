import type {MediaType} from 'minimedi'

/**
 * Formats MiniMedi opens whose MIME type is unreliable: browsers often send
 * application/octet-stream or odd vendor types for these, so the extension wins.
 */
const TYPE_BY_EXTENSION: Record<string, MediaType> = {
    '.cbz': 'comic', '.cbr': 'comic', '.cb7': 'comic', '.cbt': 'comic',
    '.zip': 'comic', // archive.org's "*_jp2.zip"; an FB2 book (".fb2.zip") is told apart by the file name
    '.fb2': 'ebook', '.mobi': 'ebook', '.azw3': 'ebook',
    '.epub': 'epub',
    '.pdf': 'pdf',
    '.srt': 'subtitle', '.vtt': 'subtitle', '.lrc': 'subtitle',
    '.txt': 'text', '.md': 'text',
}

/** MIME types of comics and e-books, for media stored without a file extension. */
const TYPE_BY_MIME: Record<string, MediaType> = {
    'application/vnd.comicbook+zip': 'comic',
    'application/vnd.comicbook-rar': 'comic',
    'application/x-cbz': 'comic',
    'application/x-cbr': 'comic',
    'application/x-cb7': 'comic',
    'application/x-cbt': 'comic',
    'application/x-fictionbook+xml': 'ebook',
    'application/x-mobipocket-ebook': 'ebook',
    'application/vnd.amazon.ebook': 'ebook',
    'application/epub+zip': 'epub',
    'application/pdf': 'pdf',
    'application/x-subrip': 'subtitle',
    'text/vtt': 'subtitle',
}

/**
 * Maps a medium to a MiniMedi viewer type: the original file name for `.fb2.zip`, then the
 * file extension, then the MIME type.
 * Returns undefined when MiniMedi has no viewer for it (download link instead).
 */
export function toMiniMediType(
    contentType: string | null,
    fileExtension: string | null,
    originalFilename: string | null = null,
): MediaType | undefined {
    // The extension of an FB2 book is just ".zip"; only the original file name says ".fb2.zip"
    if (originalFilename?.toLowerCase().endsWith('.fb2.zip')) return 'ebook'
    const byExtension = fileExtension ? TYPE_BY_EXTENSION[fileExtension.toLowerCase()] : undefined
    if (byExtension) return byExtension
    if (!contentType) return undefined

    const mime = contentType.split(';')[0].trim().toLowerCase()
    if (TYPE_BY_MIME[mime]) return TYPE_BY_MIME[mime]
    if (mime.startsWith('text/')) return 'text'
    if (mime.startsWith('audio/')) return 'audio'
    if (mime.startsWith('video/')) return 'video'
    if (mime.startsWith('image/')) return 'image'
    return undefined
}

/** Only audio and video can carry subtitle tracks. */
export function supportsSubtitles(type: MediaType | undefined): boolean {
    return type === 'audio' || type === 'video'
}

/** Recognized text (hOCR) can be laid over comic pages and single images. */
export function supportsOcr(type: MediaType | undefined): boolean {
    return type === 'comic' || type === 'image'
}
