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
            queryClient.invalidateQueries({queryKey: ['vocabularies']}) // Auch die Liste invalidieren
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
        <div className="p-8 max-w-2xl mx-auto">
            {/* Flex-Header: Navigation links, Löschen-Button oben rechts */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <button
                        onClick={() => navigate('/vocabulary')}
                        className="text-sm text-muted-foreground hover:underline mb-4 block"
                    >
                        ← Zurück zu den Vokabeln
                    </button>
                    <h1 className="text-3xl font-bold">{data?.word}</h1>
                </div>

                <button
                    onClick={() => {
                        if (confirm(`Möchtest du das Wort "${data?.word}" wirklich unwiderruflich aus deiner Lernkartei löschen?`)) {
                            deleteMutation.mutate()
                        }
                    }}
                    disabled={deleteMutation.isPending}
                    className="text-red-500 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-50 text-sm transition-colors disabled:opacity-50"
                >
                    {deleteMutation.isPending ? 'Löscht...' : 'Vokabel Löschen'}
                </button>
            </div>

            {/* Bearbeitungs-Modus vs. Standard-Infobox */}
            {editing ? (
                <div className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/10 mb-8">
                    <label className="text-xs font-medium text-muted-foreground -mb-1">Vokabel / Fremdwort</label>
                    <input
                        value={word}
                        onChange={e => setWord(e.target.value)}
                        className="border rounded-lg px-3 py-2 bg-background text-sm"
                    />
                    <label className="text-xs font-medium text-muted-foreground -mb-1">Übersetzung</label>
                    <input
                        value={translation}
                        onChange={e => setTranslation(e.target.value)}
                        className="border rounded-lg px-3 py-2 bg-background text-sm"
                    />
                    <div className="flex gap-2 justify-end mt-2">
                        <button
                            onClick={() => setEditing(false)}
                            className="border px-4 py-2 rounded-lg text-sm hover:bg-muted"
                        >
                            Abbrechen
                        </button>
                        <button
                            onClick={() => updateMutation.mutate()}
                            disabled={updateMutation.isPending}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                            {updateMutation.isPending ? 'Speichert...' : 'Speichern'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="mb-8 space-y-4">
                    <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                        <p className="text-sm">
                            <span className="text-muted-foreground block text-xs">Übersetzung:</span>
                            <span className="font-medium text-base">{data?.translation || <span
                                className="italic text-muted-foreground">Keine Übersetzung hinterlegt</span>}</span>
                        </p>
                        {data?.context_sentence && (
                            <p className="text-sm">
                                <span className="text-muted-foreground block text-xs">Kontext / Beispielsatz:</span>
                                <span className="italic">"{data.context_sentence}"</span>
                            </p>
                        )}
                    </div>

                    <button
                        onClick={() => setEditing(true)}
                        className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                    >
                        Bearbeiten
                    </button>
                </div>
            )}
        </div>
    )
}