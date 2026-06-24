import {useParams, useNavigate} from 'react-router-dom'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {deleteMedia, fetchMedium} from "@/services/media.service.ts";

export default function MediaDetailPage() {
    const {id} = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()


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

    if (isLoading) return <p className="p-8">Lädt...</p>
    if (isError) return <p className="p-8 text-red-500">Fehler beim Laden</p>

    return (
        <div className="p-8 max-w-2xl mx-auto">
            {/* Flex-Header: Navigation links, Löschen-Button oben rechts in der Ecke */}
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
                    className="text-red-500 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-50 text-sm transition-colors disabled:opacity-50"
                >
                    {deleteMutation.isPending ? 'Löscht...' : 'Medium Löschen'}
                </button>
            </div>


            <div className="mb-8">
                <p className="text-muted-foreground mb-1">{data?.content_type}</p>
                <p className="text-muted-foreground mb-4">{data?.learning_id}</p>
            </div>

        </div>
    )
}