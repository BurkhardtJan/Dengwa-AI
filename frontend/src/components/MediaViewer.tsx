import {useState, useEffect, useMemo, type ComponentProps} from 'react'
import {keepPreviousData, useQuery} from '@tanstack/react-query'
import {useTranslation} from 'react-i18next'
import {MiniMedi, type MiniMediEvent, type SubtitleFile} from 'minimedi'
import 'minimedi/dist/style.css'
import {fetchMediaBlob, fetchOcrBlob, fetchOcrInfo, fetchSubtitleBlob, fetchSubtitles} from '../services/media.service'
import {useMiniMediLabels} from '../hooks/useMiniMediLabels'
import {getLanguageDisplayName} from '../lib/languages'
import {supportsOcr, supportsSubtitles, toMiniMediType} from '../lib/mediaType'

interface Props {
    mediaId: string
    contentType: string | null
    fileExtension: string | null
    /** Receives all MiniMedi events (position, selection, subtitle cues, ...). */
    onEvent?: (event: MiniMediEvent) => void
}

export function MediaViewer({mediaId, contentType, fileExtension, onEvent}: Props) {
    const {t, i18n} = useTranslation(['media', 'common'])
    const labels = useMiniMediLabels()
    const [blobUrl, setBlobUrl] = useState<string | null>(null)
    const [error, setError] = useState(false)
    const [subtitleFiles, setSubtitleFiles] = useState<SubtitleFile[] | null>(null)
    const type = toMiniMediType(contentType, fileExtension)
    const withSubtitles = supportsSubtitles(type)
    const withOcr = supportsOcr(type)

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

    // Same query key as the subtitle manager on the page, so uploads/deletes arrive here too.
    // react-query keeps `tracks` referentially stable while the list itself doesn't change.
    const {data: tracks, isError: tracksFailed} = useQuery({
        queryKey: ['subtitles', mediaId],
        queryFn: () => fetchSubtitles(mediaId),
        enabled: withSubtitles,
    })

    // MiniMedi gets the subtitle files as blob URLs (it can't send our auth header).
    useEffect(() => {
        if (!tracks) return
        let cancelled = false
        const urls: string[] = []
        const revokeAll = () => urls.forEach(url => URL.revokeObjectURL(url))

        Promise.all(tracks.map(async track => {
            const blob = await fetchSubtitleBlob(mediaId, track.language)
            const url = URL.createObjectURL(blob)
            urls.push(url)
            return {url, label: getLanguageDisplayName(track.language, i18n.language), lang: track.language}
        }))
            .then(files => {
                if (cancelled) return revokeAll()
                setSubtitleFiles(files)
            })
            .catch(() => {
                revokeAll()
                if (!cancelled) setSubtitleFiles([])
            })

        return () => {
            cancelled = true
            revokeAll()
        }
    }, [mediaId, tracks, i18n.language])

    // Recognized text (hOCR) for comics and images; same query key as the OCR manager on the page.
    const {data: ocrInfo, isError: ocrInfoFailed} = useQuery({
        queryKey: ['ocr', mediaId],
        queryFn: () => fetchOcrInfo(mediaId),
        enabled: withOcr,
    })
    // `modified` is part of the key, so a replaced hOCR file is fetched again. The previous
    // file stays in place meanwhile, so the viewer isn't torn down (and loses its page).
    const {data: ocrBlob, isError: ocrBlobFailed} = useQuery({
        queryKey: ['ocr-file', mediaId, ocrInfo?.modified],
        queryFn: () => fetchOcrBlob(mediaId),
        enabled: withOcr && !!ocrInfo,
        staleTime: Infinity,
        placeholderData: keepPreviousData,
    })
    const ocr = ocrInfo ? ocrBlob : undefined

    const source = useMemo<ComponentProps<typeof MiniMedi>['source'] | null>(() => {
        if (!blobUrl || !type) return null
        return {
            type,
            url: blobUrl,
            // No embedded-subtitle scan: nothing here uses the detected tracks yet.
            scanEmbeddedSubtitles: false,
            ...(subtitleFiles && subtitleFiles.length > 0 ? {subtitleUrls: subtitleFiles} : {}),
            ...(ocr ? {ocr} : {}),
        }
    }, [blobUrl, type, subtitleFiles, ocr])

    // Start audio/video only once the subtitles are there, so the player isn't set up twice.
    const subtitlesReady = !withSubtitles || tracksFailed || subtitleFiles !== null
    // Same for comics and images: wait for the hOCR file if there is one
    const ocrReady = !withOcr || ocrInfoFailed || ocrInfo === null || ocrBlob !== undefined || ocrBlobFailed

    if (error) return <p className="text-sm text-destructive">{t('media:previewError')}</p>
    if (!blobUrl || !subtitlesReady || !ocrReady) return <p className="text-sm text-muted-foreground">{t('common:loading')}</p>
    if (!contentType) return <p className="text-sm text-muted-foreground">{t('media:noPreview')}</p>

    if (!source) {
        return (
            <a href={blobUrl} download className="text-sm underline hover:text-foreground">
                {t('media:downloadFile')}
            </a>
        )
    }

    return (
        <MiniMedi
            source={source}
            labels={labels}
            fullscreenButton
            onEvent={onEvent}
        />
    )
}
