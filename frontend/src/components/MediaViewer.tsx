import {useState, useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {MiniMedi, type MediaType, type MiniMediEvent} from 'minimedi'
import 'minimedi/dist/style.css'
import {fetchMediaBlob} from '../services/media.service'
import {useMiniMediLabels} from '../hooks/useMiniMediLabels'

interface Props {
    mediaId: string
    contentType: string | null
    fileExtension: string | null
    /** Receives all MiniMedi events (position, selection, subtitle cues, ...). */
    onEvent?: (event: MiniMediEvent) => void
}

/**
 * Formats MiniMedi opens whose MIME type is unreliable: browsers often send
 * application/octet-stream or odd vendor types for these, so the extension wins.
 */
const TYPE_BY_EXTENSION: Record<string, MediaType> = {
    '.cbz': 'comic', '.cbr': 'comic', '.cb7': 'comic', '.cbt': 'comic',
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
 * Maps a medium to a MiniMedi viewer type: file extension first, then MIME type.
 * Returns undefined when MiniMedi has no viewer for it (download link instead).
 */
function toMiniMediType(contentType: string | null, fileExtension: string | null): MediaType | undefined {
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

export function MediaViewer({mediaId, contentType, fileExtension, onEvent}: Props) {
    const {t} = useTranslation(['media', 'common'])
    const labels = useMiniMediLabels()
    const [blobUrl, setBlobUrl] = useState<string | null>(null)
    const [error, setError] = useState(false)
    const type = toMiniMediType(contentType, fileExtension)

    // The parent keys this component by media id, so state starts fresh per medium.
    useEffect(() => {
        let cancelled = false
        let url: string | null = null

        fetchMediaBlob(mediaId)
            .then(blob => {
                if (cancelled) return
                // MiniMedi shows "text" in an <iframe>: without an explicit charset the
                // browser may guess a legacy encoding and garble umlauts / CJK text.
                const data = type === 'text' ? new Blob([blob], {type: 'text/plain;charset=utf-8'}) : blob
                url = URL.createObjectURL(data)
                setBlobUrl(url)
            })
            .catch(() => {
                if (!cancelled) setError(true)
            })

        return () => {
            cancelled = true
            if (url) URL.revokeObjectURL(url)
        }
    }, [mediaId, type])

    if (error) return <p className="text-sm text-destructive">{t('media:previewError')}</p>
    if (!blobUrl) return <p className="text-sm text-muted-foreground">{t('common:loading')}</p>
    if (!contentType) return <p className="text-sm text-muted-foreground">{t('media:noPreview')}</p>

    if (!type) {
        return (
            <a href={blobUrl} download className="text-sm underline hover:text-foreground">
                {t('media:downloadFile')}
            </a>
        )
    }

    return (
        // No embedded-subtitle scan: nothing here uses the detected tracks yet.
        <MiniMedi
            source={{type, url: blobUrl, scanEmbeddedSubtitles: false}}
            labels={labels}
            fullscreenButton
            onEvent={onEvent}
        />
    )
}
