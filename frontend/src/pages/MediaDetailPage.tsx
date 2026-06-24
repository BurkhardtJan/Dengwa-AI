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
        <div className="p-8 max-w-lg">
            <button
                onClick={() => navigate('/media')}
                className="text-sm text-muted-foreground hover:underline mb-6"
            >
                ← Zurück
            </button>

            <h1 className="text-3xl font-bold mb-6">{data?.title}</h1>


            <div className="mb-8">
                <p className="text-muted-foreground mb-1">{data?.content_type}</p>
                <p className="text-muted-foreground mb-4">{data?.learning_id}</p>
            </div>

            <button
                onClick={() => deleteMutation.mutate()}
                className="text-red-500 border border-red-500 px-4 py-2 rounded-lg hover:bg-red-50"
            >
                Löschen
            </button>
        </div>
    )
}