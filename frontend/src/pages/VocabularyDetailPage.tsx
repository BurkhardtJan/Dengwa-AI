import {useParams, useNavigate} from 'react-router-dom'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {fetchVocabulary, deleteVocabulary} from '../services/vocabulary.service'

export default function VocabularyDetailPage() {
    const {id} = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const {data, isLoading, isError} = useQuery({
        queryKey: ['vocabulary', id],
        queryFn: () => fetchVocabulary(id!)
    })

    const deleteMutation = useMutation({
        mutationFn: () => deleteVocabulary(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['vocabularies']})
            navigate('/vocabulary')
        }
    })

    if (isLoading) return <p className="p-8">Lädt...</p>
    if (isError) return <p className="p-8 text-red-500">Fehler beim Laden</p>

    return (
        <div className="p-8 max-w-lg">
            <button onClick={() => navigate('/vocabulary')}
                    className="text-sm text-muted-foreground hover:underline mb-6">
                ← Zurück
            </button>
            <h1 className="text-3xl font-bold mb-2">{data?.word}</h1>
            <p className="text-muted-foreground mb-1">{data?.translation}</p>
            <p className="text-muted-foreground mb-8">{data?.context_sentence}</p>

            <button
                onClick={() => deleteMutation.mutate()}
                className="text-red-500 border border-red-500 px-4 py-2 rounded-lg hover:bg-red-50"
            >
                Löschen
            </button>
        </div>
    )
}