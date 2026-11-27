import {useRef, useState} from 'react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {isAxiosError} from 'axios'
import {useTranslation} from 'react-i18next'
import {deleteSubtitle, fetchSubtitles, uploadSubtitle} from '@/services/media.service'
import {CURATED_LANGUAGE_CODES, getLanguageDisplayName} from '@/lib/languages'

interface Props {
    mediaId: string
    /** ISO 639-1 code of the medium; preselected for new subtitles. */
    mediaLanguage: string
}

/** Lists the subtitle tracks of an audio/video medium and lets the user add or remove them. */
export default function SubtitleManager({mediaId, mediaLanguage}: Props) {
    const {t, i18n} = useTranslation(['media', 'common'])
    const queryClient = useQueryClient()
    const fileInput = useRef<HTMLInputElement>(null)
    const [language, setLanguage] = useState(mediaLanguage)
    const [file, setFile] = useState<File | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    // Same query key as the viewer, so a change shows up in the player right away.
    const {data: tracks} = useQuery({
        queryKey: ['subtitles', mediaId],
        queryFn: () => fetchSubtitles(mediaId),
    })

    const onChanged = () => {
        queryClient.invalidateQueries({queryKey: ['subtitles', mediaId]})
        // The track in the medium's language feeds its text, so summary and topics change too
        queryClient.invalidateQueries({queryKey: ['media', mediaId]})
    }

    const uploadMutation = useMutation({
        mutationFn: () => uploadSubtitle(mediaId, file!, language),
        onSuccess: () => {
            setFile(null)
            setErrorMessage(null)
            if (fileInput.current) fileInput.current.value = ''
            onChanged()
        },
        onError: error => {
            const detail = isAxiosError(error) ? error.response?.data?.detail : undefined
            setErrorMessage(typeof detail === 'string' ? detail : t('media:subtitleUploadError'))
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (trackLanguage: string) => deleteSubtitle(mediaId, trackLanguage),
        onSuccess: onChanged,
    })

    const languageName = (code: string) => getLanguageDisplayName(code, i18n.language)
    const languageCodes = Array.from(new Set([mediaLanguage, ...CURATED_LANGUAGE_CODES]))

    return (
        <div className="p-4 border rounded-lg">
            <h2 className="text-sm font-semibold mb-1">{t('media:subtitlesTitle')}</h2>
            <p className="text-xs text-muted-foreground mb-3">{t('media:subtitlesDescription')}</p>

            {tracks && tracks.length > 0 && (
                <ul className="mb-3 border rounded-lg divide-y">
                    {tracks.map(track => (
                        <li key={track.language} className="flex items-center gap-2 px-3 py-2 text-sm">
                            <span className="font-medium">{languageName(track.language)}</span>
                            <span className="text-xs text-muted-foreground">{track.file_extension}</span>
                            {track.is_source && (
                                <span
                                    title={t('media:subtitleSourceHint')}
                                    className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                                >
                                    {t('media:subtitleSource')}
                                </span>
                            )}
                            <button
                                onClick={() => {
                                    if (confirm(t('media:subtitleDeleteConfirm', {language: languageName(track.language)}))) {
                                        deleteMutation.mutate(track.language)
                                    }
                                }}
                                disabled={deleteMutation.isPending}
                                className="ml-auto text-xs text-destructive hover:underline disabled:opacity-50"
                            >
                                {t('media:subtitleDelete')}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {tracks && tracks.length === 0 && (
                <p className="text-sm text-muted-foreground mb-3">{t('media:subtitlesEmpty')}</p>
            )}

            <div className="flex flex-wrap items-center gap-2">
                <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    aria-label={t('media:subtitleLanguage')}
                    className="border rounded-lg px-3 py-2 text-sm bg-background"
                >
                    {languageCodes.map(code => (
                        <option key={code} value={code}>{languageName(code)}</option>
                    ))}
                </select>
                <input
                    ref={fileInput}
                    type="file"
                    accept=".srt,.vtt,.lrc"
                    onChange={e => setFile(e.target.files?.[0] ?? null)}
                    className="text-sm"
                />
                <button
                    onClick={() => uploadMutation.mutate()}
                    disabled={!file || uploadMutation.isPending}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                    {uploadMutation.isPending ? t('media:subtitleUploading') : t('media:subtitleUpload')}
                </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{t('media:subtitleReplaceHint')}</p>
            {errorMessage && <p className="text-sm text-destructive mt-2">{errorMessage}</p>}
        </div>
    )
}
