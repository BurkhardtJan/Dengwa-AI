import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import Modal from '../components/Modal'
import {fetchMedia, uploadMedia} from "@/services/media.service.ts";
import type {components} from '../types/api'
import {useLanguage} from "@/context/LanguageContext.tsx";

type Media = components['schemas']['MediaResponse']

function MediaPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const {selectedLan} = useLanguage()
    const [title, setTitle] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [showForm, setShowForm] = useState(false)

    const {data, isLoading, isError} = useQuery({
        queryKey: ['media', selectedLan],
        queryFn: () => fetchMedia(selectedLan ?? undefined)
    })

    const createMutation = useMutation({
        mutationFn: () => uploadMedia(selectedLan!, title, file!),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['media']})
            setTitle('')
            setFile(null)  // ← null statt ''
            setShowForm(false)
        }
    })


    if (isLoading) return <p className="p-8">Lädt...</p>
    if (isError) return <p className="p-8 text-red-500">Fehler beim Laden</p>

    return (
        <div className="min-h-screen p-8">
            <h1 className="text-3xl font-bold mb-8">Medien</h1>

            <div className="grid gap-4">
                {selectedLan && (
                    <div onClick={() => setShowForm(v => !v)}
                         className="border rounded-lg p-4 cursor-pointer hover:bg-muted">
                        <p className="font-medium">{selectedLan}</p>
                        <p className="text-muted-foreground">Medium hinzufügen</p>
                    </div>
                )}
                {showForm && (
                    <Modal onClose={() => setShowForm(false)}>
                        <h2 className="text-lg font-bold mb-4">Neue Vokabel</h2>
                        <div className="flex flex-col gap-3">
                            <input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Titel"
                                className="border rounded-lg px-3 py-2"
                            />
                            <input
                                type="file"
                                onChange={e => setFile(e.target.files?.[0] ?? null)}
                            />
                            <button onClick={() => createMutation.mutate()}>
                                Speichern
                            </button>
                        </div>
                    </Modal>
                )}
                {(data ?? []).map((media: Media) => (
                    <div
                        key={media.id}
                        className="border rounded-lg p-4 cursor-pointer hover:bg-muted"
                        onClick={() => navigate(`/media/${media.id}`)}
                    >
                        <p className="font-medium">{media.title}</p>
                        <p className="text-muted-foreground">{media.learning_id}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default MediaPage