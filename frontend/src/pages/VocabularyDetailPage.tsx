import {useState, useEffect} from 'react'
import {useParams, useNavigate} from 'react-router-dom'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {fetchVocabulary, deleteVocabulary, updateVocabulary} from '../services/vocabulary.service'
import {useTranslation} from 'react-i18next'

export default function VocabularyDetailPage() {
    const {id} = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const [editing, setEditing] = useState(false)
    const [word, setWord] = useState('')
    const [translation, setTranslation] = useState('')
    const [contextSentence, setContextSentence] = useState('')

    const {t} = useTranslation(['common', 'vocabulary'])


    const {data, isLoading, isError} = useQuery({
        queryKey: ['vocabulary', id],
        queryFn: () => fetchVocabulary(id!),
    })

    useEffect(() => {
        if (data) {
            setWord(data.word)
            setTranslation(data.translation ?? '')
            setContextSentence(data.context_sentence ?? '')
        }
    }, [data])

    const updateMutation = useMutation({
        mutationFn: () => updateVocabulary(id!, {
            word,
            translation,
            context_sentence: contextSentence
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['vocabulary', id]})
            queryClient.invalidateQueries({queryKey: ['vocabularies']})
            setEditing(false)
        }
    })

    const deleteMutation = useMutation({
        mutationFn: () => deleteVocabulary(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['vocabularies']})
            navigate('/vocabulary')
        }
    })

    if (isLoading) return <p className="p-8">{t('common:loading')}</p>
    if (isError) return <p className="p-8 text-destructive">{t('common:errorLoading')}</p>

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <button
                        onClick={() => navigate('/vocabulary')}
                        className="text-sm text-muted-foreground hover:underline mb-4 block"
                    >
                        {t('vocabulary:backToVocabulary')}
                    </button>
                    <h1 className="text-3xl font-bold">{data?.word}</h1>
                </div>

                <button
                    onClick={() => {
                        if (confirm(t('vocabulary:deleteConfirm', {word: data?.word}))) {
                            deleteMutation.mutate()
                        }
                    }}
                    disabled={deleteMutation.isPending}
                    className="text-destructive border border-destructive/30 px-3 py-1.5 rounded-lg hover:bg-destructive/5 text-sm transition-colors disabled:opacity-50"
                >
                    {deleteMutation.isPending ? t('vocabulary:deleting') : t('vocabulary:deleteButton')}
                </button>
            </div>

            {editing ? (
                <div className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/10 mb-8">
                    <label
                        className="text-xs font-medium text-muted-foreground -mb-1">{t('vocabulary:foreignWord')}</label>
                    <input
                        value={word}
                        onChange={e => setWord(e.target.value)}
                        className="border rounded-lg px-3 py-2 bg-background text-sm"
                        placeholder={t('vocabulary:wordPlaceholder')}
                    />
                    <label
                        className="text-xs font-medium text-muted-foreground -mb-1">{t('vocabulary:translationField')}</label>
                    <input
                        value={translation}
                        onChange={e => setTranslation(e.target.value)}
                        className="border rounded-lg px-3 py-2 bg-background text-sm"
                        placeholder={t('vocabulary:translationPlaceholder')}
                    />
                    <label
                        className="text-xs font-medium text-muted-foreground -mb-1">{t('vocabulary:contextLabel')}</label>
                    <input
                        value={contextSentence}
                        onChange={e => setContextSentence(e.target.value)}
                        className="border rounded-lg px-3 py-2 bg-background text-sm"
                        placeholder={t('vocabulary:contextPlaceholder')}
                    />
                    <div className="flex gap-2 justify-end mt-2">
                        <button
                            onClick={() => setEditing(false)}
                            className="border px-4 py-2 rounded-lg text-sm hover:bg-muted"
                        >
                            {t('common:buttons.cancel')}
                        </button>
                        <button
                            onClick={() => updateMutation.mutate()}
                            disabled={updateMutation.isPending}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                            {updateMutation.isPending ? t('common:buttons.saving') : t('common:buttons.save')}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="mb-8 space-y-4">
                    <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                        <p className="text-sm">
                            <span
                                className="text-muted-foreground block text-xs">{t('vocabulary:translationLabel')}:</span>
                            <span className="font-medium text-base">{data?.translation || <span
                                className="italic text-muted-foreground">{t('vocabulary:noTranslation')}</span>}</span>
                        </p>
                        {data?.context_sentence && (
                            <p className="text-sm">
                                <span
                                    className="text-muted-foreground block text-xs">{t('vocabulary:contextField')}</span>
                                <span className="italic">"{data.context_sentence}"</span>
                            </p>
                        )}
                        {data?.comment && (
                            <p className="text-sm">
                                <span
                                    className="text-muted-foreground block text-xs">{t('vocabulary:commentField')}:</span>
                                <span>{data.comment}</span>
                            </p>
                        )}
                    </div>

                    <button
                        onClick={() => setEditing(true)}
                        className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                    >
                        {t('common:buttons.edit')}
                    </button>
                </div>
            )}
        </div>
    )
}