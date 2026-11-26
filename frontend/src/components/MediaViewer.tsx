import {useState, useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {MiniMedi, type MediaType} from 'minimedi'
import 'minimedi/dist/style.css'
import {fetchMediaBlob} from '../services/media.service'
import {useMiniMediLabels} from '../hooks/useMiniMediLabels'

interface Props {
    mediaId: string
    contentType: string | null
}

/**
 * Maps the stored MIME type to a MiniMedi viewer type.
 * Returns undefined when MiniMedi has no viewer for it (download link instead).
 */
function toMiniMediType(contentType: string): MediaType | undefined {
    const mime = contentType.split(';')[0].trim().toLowerCase()

    if (mime === 'application/x-subrip' || mime === 'text/vtt') return 'subtitle'
    if (mime.startsWith('text/')) return 'text'
    if (mime === 'application/pdf') return 'pdf'
    if (mime === 'application/epub+zip') return 'epub'
    if (mime.startsWith('audio/')) return 'audio'
    if (mime.startsWith('video/')) return 'video'
    if (mime.startsWith('image/')) return 'image'
    return undefined
}

export function MediaViewer({mediaId, contentType}: Props) {
    const {t} = useTranslation(['media', 'common'])
    const labels = useMiniMediLabels()
    const [blobUrl, setBlobUrl] = useState<string | null>(null)
    const [error, setError] = useState(false)
    const type = contentType ? toMiniMediType(contentType) : undefined

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
        />
    )
}
