import {useState, useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {fetchMediaFile} from '../services/media.service'

interface Props {
    mediaId: string
    contentType: string | null
}

export function MediaViewer({mediaId, contentType}: Props) {
    const {t} = useTranslation(['media', 'common'])
    const [blobUrl, setBlobUrl] = useState<string | null>(null)
    const [error, setError] = useState(false)

    useEffect(() => {
        fetchMediaFile(mediaId)
            .then(setBlobUrl)
            .catch(() => setError(true))

        return () => {
            if (blobUrl) URL.revokeObjectURL(blobUrl)
        }
    }, [mediaId])

    if (error) return <p className="text-sm text-destructive">{t('media:previewError')}</p>
    if (!blobUrl) return <p className="text-sm text-muted-foreground">{t('common:loading')}</p>
    if (!contentType) return <p className="text-sm text-muted-foreground">{t('media:noPreview')}</p>

    if (contentType.startsWith('text/'))
        return <TextViewer blobUrl={blobUrl}/>

    if (contentType === 'application/x-subrip')
        return <TextViewer blobUrl={blobUrl}/>

    if (contentType === 'application/pdf')
        return <iframe src={blobUrl} className="w-full h-[600px] border rounded-lg"/>

    if (contentType.startsWith('audio/'))
        return <audio controls src={blobUrl} className="w-full mt-2"/>

    if (contentType.startsWith('video/'))
        return <video controls src={blobUrl} className="w-full rounded-lg mt-2"/>

    return (
        <a href={blobUrl} download className="text-sm underline hover:text-foreground">
            {t('media:downloadFile')}
        </a>
    )
}

function TextViewer({blobUrl}: { blobUrl: string }) {
    const {t} = useTranslation('common')
    const [text, setText] = useState<string | null>(null)

    useEffect(() => {
        fetch(blobUrl)
            .then(r => r.text())
            .then(setText)
    }, [blobUrl])

    if (!text) return <p className="text-sm text-muted-foreground">{t('loading')}</p>

    return (
        <pre
            className="w-full p-4 border rounded-lg bg-muted/20 text-sm whitespace-pre-wrap overflow-y-auto max-h-[600px]">
            {text}
        </pre>
    )
}