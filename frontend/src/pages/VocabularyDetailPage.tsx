import {useState, useEffect} from 'react'
import {useParams, useNavigate} from 'react-router-dom'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {fetchVocabulary, deleteVocabulary, updateVocabulary} from '../services/vocabulary.service'

export default function VocabularyDetailPage() {
    const {id} = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const [editing, setEditing] = useState(false)
    const [word, setWord] = useState('')
    const [translation, setTranslation] = useState('')

    const {data, isLoading, isError} = useQuery({
        queryKey: ['vocabulary', id],
        queryFn: () => fetchVocabulary(id!),
    })
    useEffect(() => {
        if (data) {
            setWord(data.word)
            setTranslation(data.translation ?? '')
        }
    }, [data])

    const updateMutation = useMutation({
        mutationFn: () => updateVocabulary(id!, {word, translation}),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['vocabulary', id]})
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

    if (isLoading) return <p className="p-8">Lädt...</p>
    if (isError) return <p className="p-8 text-red-500">Fehler beim Laden</p>

    return (
        <div className="p-8 max-w-lg">
            <button
                onClick={() => navigate('/vocabulary')}
                className="text-sm text-muted-foreground hover:underline mb-6"
            >
                ← Zurück
            </button>

            <h1 className="text-3xl font-bold mb-6">{data?.word}</h1>

            {editing ? (
                <div className="flex flex-col gap-3 mb-8">
                    <input
                        value={word}
                        onChange={e => setWord(e.target.value)}
                        className="border rounded-lg px-3 py-2"
                    />
                    <input
                        value={translation}
                        onChange={e => setTranslation(e.target.value)}
                        className="border rounded-lg px-3 py-2"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => updateMutation.mutate()}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg"
                        >
                            Speichern
                        </button>
                        <button
                            onClick={() => setEditing(false)}
                            className="border px-4 py-2 rounded-lg"
                        >
                            Abbrechen
                        </button>
                    </div>
                </div>
            ) : (
                <div className="mb-8">
                    <p className="text-muted-foreground mb-1">{data?.translation}</p>
                    <p className="text-muted-foreground mb-4">{data?.context_sentence}</p>
                    <button
                        onClick={() => setEditing(true)}
                        className="text-sm hover:underline"
                    >
                        Bearbeiten
                    </button>
                </div>
            )}

            <button
                onClick={() => deleteMutation.mutate()}
                className="text-red-500 border border-red-500 px-4 py-2 rounded-lg hover:bg-red-50"
            >
                Löschen
            </button>
        </div>
    )
}