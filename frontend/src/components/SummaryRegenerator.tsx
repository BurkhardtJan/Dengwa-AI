import {useEffect, useState} from 'react'
import {useMutation, useQuery} from '@tanstack/react-query'
import {isAxiosError} from 'axios'
import {useTranslation} from 'react-i18next'
import {fetchMedium, generateMetadata} from '@/services/media.service'
import {useChatProviders} from '@/hooks/useModelOptions'
import ProviderModelSelect from '@/components/chat/ProviderModelSelect'

interface Props {
    mediaId: string
}

/** How long we keep looking for a new summary before pointing to the backend log. */
const WAIT_TIMEOUT_MS = 3 * 60 * 1000
const POLL_INTERVAL_MS = 4000

type Metadata = Awaited<ReturnType<typeof fetchMedium>>

/** Changes whenever the generated values change, so we notice that the run is done. */
function signature(medium: Metadata | undefined): string {
    return [medium?.summary, medium?.topics?.join('|'), medium?.genre, medium?.difficulty_estimate].join('||')
}

/** Lets the user create summary, topics, genre and difficulty of a medium again, optionally with another LLM. */
export default function SummaryRegenerator({mediaId}: Props) {
    const {t} = useTranslation(['media', 'common'])
    const {data: providers, isLoading: providersLoading} = useChatProviders()
    const [provider, setProvider] = useState<string | null>(null)
    const [model, setModel] = useState<string | null>(null)
    const [run, setRun] = useState<{ baseline: string, timedOut: boolean } | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const waiting = run !== null && !run.timedOut

    // Same query key as the page; while a run is going we poll it until the values change.
    const {data: medium} = useQuery({
        queryKey: ['media', mediaId],
        queryFn: () => fetchMedium(mediaId),
        refetchInterval: waiting ? POLL_INTERVAL_MS : false,
    })

    const changed = run !== null && medium !== undefined && signature(medium) !== run.baseline
    const showStarted = waiting && !changed
    const showTimeout = run !== null && run.timedOut && !changed

    useEffect(() => {
        if (!run || run.timedOut) return
        const timer = setTimeout(() => setRun(current => current && {...current, timedOut: true}), WAIT_TIMEOUT_MS)
        return () => clearTimeout(timer)
    }, [run])

    const mutation = useMutation({
        mutationFn: () => generateMetadata(mediaId, provider, model),
        onSuccess: () => {
            setErrorMessage(null)
            setRun({baseline: signature(medium), timedOut: false})
        },
        onError: error => {
            const detail = isAxiosError(error) ? error.response?.data?.detail : undefined
            setErrorMessage(typeof detail === 'string' ? detail : t('media:summaryError'))
        },
    })

    return (
        <div className="p-4 border rounded-lg">
            <h2 className="text-sm font-semibold mb-1">{t('media:summaryTitle')}</h2>
            <p className="text-xs text-muted-foreground mb-3">{t('media:summaryDescription')}</p>
            <div className="flex flex-wrap items-center gap-3">
                <ProviderModelSelect
                    providers={providers?.providers}
                    isLoading={providersLoading}
                    provider={provider}
                    model={model}
                    onProviderChange={next => {
                        setProvider(next)
                        setModel(null)
                    }}
                    onModelChange={setModel}
                />
                <button
                    onClick={() => mutation.mutate()}
                    disabled={mutation.isPending || showStarted}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                    {mutation.isPending ? t('media:summaryRunning') : t('media:summaryButton')}
                </button>
            </div>
            {showStarted && <p className="text-sm text-muted-foreground mt-3">{t('media:summaryStarted')}</p>}
            {showTimeout && <p className="text-sm text-muted-foreground mt-3">{t('media:summaryTimeout')}</p>}
            {errorMessage && <p className="text-sm text-destructive mt-3">{errorMessage}</p>}
        </div>
    )
}
