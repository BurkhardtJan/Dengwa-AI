import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import Modal from '../components/Modal'
import {fetchMedia, uploadMedia} from "@/services/media.service.ts";
import type {components} from '../types/api'
import {useLanguage} from "@/context/TargetLanguageContext.tsx";

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
    if (isError) return <p className="p-8 text-destructive">Fehler beim Laden</p>

    return (
        <div className="min-h-screen p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Medien</h1>

                {selectedLan && (
                    <button
                        onClick={() => setShowForm(v => !v)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        + Medium hinzufügen
                    </button>
                )}
            </div>

            <div className="grid gap-4">
                {(data ?? []).length === 0 ? (
                        <p className="text-muted-foreground text-sm italic">
                            {selectedLan
                                ? `Noch kein Medium für ${selectedLan} vorhanden. Klicke auf "+ Medium hinzufügen".`
                                : 'Bitte wähle zuerst eine Sprache in der Sidebar aus.'}
                        </p>
                    ) :
                    (data ?? []).map((media: Media) => (
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
            {showForm && (
                <Modal onClose={() => setShowForm(false)}>
                    <h2 className="text-lg font-bold mb-4">Neues Medium</h2>
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
                            className="border rounded-lg px-3 py-2"
                        />
                        <button
                            onClick={() => createMutation.mutate()}
                            disabled={!title || !file || createMutation.isPending}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                            {createMutation.isPending ? 'Lädt hoch...' : 'Speichern'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    )
}

export default MediaPage