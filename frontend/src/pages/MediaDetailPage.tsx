import {useParams, useNavigate} from 'react-router-dom'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {deleteMedia, fetchMedium, extractVocabulary} from "@/services/media.service.ts"
import {useState} from 'react'
import {MediaViewer} from '../components/MediaViewer'
import {useTranslation} from 'react-i18next'

export default function MediaDetailPage() {
    const {id} = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const {t} = useTranslation(['media', 'common'])
    const [extractSuccess, setExtractSuccess] = useState(false)

    const {data, isLoading, isError} = useQuery({
        queryKey: ['media', id],
        queryFn: () => fetchMedium(id!),
    })

    const deleteMutation = useMutation({
        mutationFn: () => deleteMedia(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['media']})
            navigate('/media')
        }
    })

    const extractMutation = useMutation({
        mutationFn: () => extractVocabulary(id!),
        onSuccess: () => {
            setExtractSuccess(true)
            queryClient.invalidateQueries({queryKey: ['vocabularies']})
        }
    })

    if (isLoading) return <p className="p-8">{t('common:loading')}</p>
    if (isError) return <p className="p-8 text-destructive">{t('common:errorLoading')}</p>

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <button
                        onClick={() => navigate('/media')}
                        className="text-sm text-muted-foreground hover:underline mb-4 block"
                    >
                        {t('backToMedia')}
                    </button>
                    <h1 className="text-3xl font-bold">{data?.title}</h1>
                </div>
                <button
                    onClick={() => {
                        if (confirm(t('deleteConfirm'))) {
                            deleteMutation.mutate()
                        }
                    }}
                    disabled={deleteMutation.isPending}
                    className="text-destructive border border-destructive/30 px-3 py-1.5 rounded-lg hover:bg-destructive/5 text-sm transition-colors disabled:opacity-50"
                >
                    {deleteMutation.isPending ? t('deleting') : t('deleteButton')}
                </button>
            </div>

            <div className="mb-8">
                <p className="text-muted-foreground mb-4">{data?.learning_id}</p>
            </div>

            <div className="mb-8">
                <p className="text-muted-foreground mb-1">{data?.content_type}</p>
                <MediaViewer mediaId={id!} contentType={data?.content_type ?? null}/>
            </div>

            <div className="flex flex-col gap-3">
                <div className="p-4 border rounded-lg">
                    <h2 className="text-sm font-semibold mb-1">{t('extractTitle')}</h2>
                    <p className="text-xs text-muted-foreground mb-3">{t('extractDescription')}</p>
                    {extractSuccess ? (
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                            {t('extractSuccess')}
                        </p>
                    ) : (
                        <button
                            onClick={() => extractMutation.mutate()}
                            disabled={extractMutation.isPending}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                            {extractMutation.isPending ? t('extracting') : t('extractButton')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}