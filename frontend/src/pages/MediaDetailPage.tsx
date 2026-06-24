import {useParams, useNavigate} from 'react-router-dom'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {deleteMedia, fetchMedium, extractVocabulary} from "@/services/media.service.ts"
import {useState} from 'react'

export default function MediaDetailPage() {
    const {id} = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
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

    if (isLoading) return <p className="p-8">Lädt...</p>
    if (isError) return <p className="p-8 text-destructive">Fehler beim Laden</p>

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <button
                        onClick={() => navigate('/media')}
                        className="text-sm text-muted-foreground hover:underline mb-4 block"
                    >
                        ← Zurück zu den Medien
                    </button>
                    <h1 className="text-3xl font-bold">{data?.title}</h1>
                </div>

                <button
                    onClick={() => {
                        if (confirm('Möchtest du dieses Medium wirklich unwiderruflich löschen? Alle verknüpften Chats und Vokabelzuordnungen könnten verloren gehen.')) {
                            deleteMutation.mutate()
                        }
                    }}
                    disabled={deleteMutation.isPending}
                    className="text-destructive border border-destructive/30 px-3 py-1.5 rounded-lg hover:bg-destructive/5 text-sm transition-colors disabled:opacity-50"
                >
                    {deleteMutation.isPending ? 'Löscht...' : 'Medium Löschen'}
                </button>
            </div>


            <div className="mb-8">
                <p className="text-muted-foreground mb-1">{data?.content_type}</p>
                <p className="text-muted-foreground mb-4">{data?.learning_id}</p>
            </div>
            <div className="flex flex-col gap-3">
                <div className="p-4 border rounded-lg">
                    <h2 className="text-sm font-semibold mb-1">Vokabeln extrahieren</h2>
                    <p className="text-xs text-muted-foreground mb-3">
                        Lässt die KI automatisch Vokabeln aus diesem Medium erkennen und in deine Lernkartei eintragen.
                    </p>
                    {extractSuccess ? (
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                            ✓ Vokabeln wurden erfolgreich extrahiert.
                        </p>
                    ) : (
                        <button
                            onClick={() => extractMutation.mutate()}
                            disabled={extractMutation.isPending}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                            {extractMutation.isPending ? 'Extrahiert...' : 'Vokabeln extrahieren'}
                        </button>
                    )}
                </div>
            </div>

        </div>
    )
}