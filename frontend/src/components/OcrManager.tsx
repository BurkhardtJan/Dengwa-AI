import {useRef, useState} from 'react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {isAxiosError} from 'axios'
import {useTranslation} from 'react-i18next'
import {deleteOcr, fetchOcrInfo, uploadOcr} from '@/services/media.service'

interface Props {
    mediaId: string
}

function formatSize(bytes: number): string {
    return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

/** Shows whether a comic or image has recognized text (hOCR) and lets the user add, replace or remove it. */
export default function OcrManager({mediaId}: Props) {
    const {t} = useTranslation(['media', 'common'])
    const queryClient = useQueryClient()
    const fileInput = useRef<HTMLInputElement>(null)
    const [file, setFile] = useState<File | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    // Same query key as the viewer, so a change shows up in the viewer right away.
    const {data: ocr} = useQuery({
        queryKey: ['ocr', mediaId],
        queryFn: () => fetchOcrInfo(mediaId),
    })

    const onChanged = () => {
        queryClient.invalidateQueries({queryKey: ['ocr', mediaId]})
        // The recognized text feeds the medium's text, so summary and topics change too
        queryClient.invalidateQueries({queryKey: ['media', mediaId]})
    }

    const uploadMutation = useMutation({
        mutationFn: () => uploadOcr(mediaId, file!),
        onSuccess: () => {
            setFile(null)
            setErrorMessage(null)
            if (fileInput.current) fileInput.current.value = ''
            onChanged()
        },
        onError: error => {
            const detail = isAxiosError(error) ? error.response?.data?.detail : undefined
            setErrorMessage(typeof detail === 'string' ? detail : t('media:ocrUploadError'))
        },
    })

    const deleteMutation = useMutation({
        mutationFn: () => deleteOcr(mediaId),
        onSuccess: onChanged,
    })

    return (
        <div className="p-4 border rounded-lg">
            <h2 className="text-sm font-semibold mb-1">{t('media:ocrTitle')}</h2>
            <p className="text-xs text-muted-foreground mb-3">{t('media:ocrDescription')}</p>

            {ocr !== undefined && (
                <div className="flex items-center gap-2 mb-3 text-sm">
                    <span className={ocr ? '' : 'text-muted-foreground'}>
                        {ocr ? t('media:ocrPresent', {size: formatSize(ocr.size)}) : t('media:ocrNone')}
                    </span>
                    {ocr && (
                        <button
                            onClick={() => {
                                if (confirm(t('media:ocrDeleteConfirm'))) deleteMutation.mutate()
                            }}
                            disabled={deleteMutation.isPending}
                            className="ml-auto text-xs text-destructive hover:underline disabled:opacity-50"
                        >
                            {t('media:ocrDelete')}
                        </button>
                    )}
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
                <input
                    ref={fileInput}
                    type="file"
                    accept=".hocr,.html,.htm"
                    aria-label={t('media:ocrChooseFile')}
                    onChange={e => setFile(e.target.files?.[0] ?? null)}
                    className="text-sm"
                />
                <button
                    onClick={() => uploadMutation.mutate()}
                    disabled={!file || uploadMutation.isPending}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                    {uploadMutation.isPending ? t('media:ocrUploading') : ocr ? t('media:ocrReplace') : t('media:ocrUpload')}
                </button>
            </div>
            {errorMessage && <p className="text-sm text-destructive mt-2">{errorMessage}</p>}
        </div>
    )
}
