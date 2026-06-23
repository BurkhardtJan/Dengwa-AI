import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import Modal from '../components/Modal'
import {fetchLanguages} from "../services/language.service.ts";
import {fetchVocabularies, createVocabulary} from '../services/vocabulary.service'
import type {components} from '../types/api'

type Vocabulary = components['schemas']['VocabularyResponse']
type VocabularyCreate = components['schemas']['VocabularyCreate']

function VocabularyPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [selectedLan, setSelectedLan] = useState<string | null>(null)
    const [newWord, setNewWord] = useState('')
    const [newTranslation, setNewTranslation] = useState('')
    const [showForm, setShowForm] = useState(false)

    const {data, isLoading, isError} = useQuery({
        queryKey: ['vocabularies', selectedLan],
        queryFn: () => fetchVocabularies(selectedLan ?? undefined)
    })
    const {data: languages} = useQuery({
        queryKey: ['languages'],
        queryFn: fetchLanguages
    })


    const createMutation = useMutation({
        mutationFn: (data: VocabularyCreate) => createVocabulary(selectedLan!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['vocabularies']})
            setNewWord('')
            setNewTranslation('')
            setShowForm(false)
        }
    })

    if (isLoading) return <p className="p-8">Lädt...</p>
    if (isError) return <p className="p-8 text-red-500">Fehler beim Laden</p>

    return (
        <div className="min-h-screen p-8">
            <h1 className="text-3xl font-bold mb-8">Vokabeln</h1>
            <select
                value={selectedLan ?? ''}
                onChange={e => setSelectedLan(e.target.value)}
                className="border rounded-lg px-3 py-2"
            >
                <option value="" disabled>Sprache wählen...</option>
                {languages?.map(lan => (
                    <option key={lan.id} value={lan.learning_language}>
                        {lan.learning_language}
                    </option>
                ))}
            </select>
            {selectedLan && (
                <button onClick={() => setShowForm(v => !v)}>
                    Vokabel hinzufügen
                </button>
            )}
            {showForm && (
                <Modal onClose={() => setShowForm(false)}>
                    <h2 className="text-lg font-bold mb-4">Neue Vokabel</h2>
                    <div className="flex flex-col gap-3">
                        <input
                            value={newWord}
                            onChange={e => setNewWord(e.target.value)}
                            placeholder="Wort"
                            className="border rounded-lg px-3 py-2"
                        />
                        <input
                            value={newTranslation}
                            onChange={e => setNewTranslation(e.target.value)}
                            placeholder="Übersetzung"
                            className="border rounded-lg px-3 py-2"
                        />
                        <button onClick={() => createMutation.mutate({word: newWord, translation: newTranslation})}>
                            Speichern
                        </button>
                    </div>
                </Modal>
            )}
            <div className="grid gap-4">
                {(data ?? []).map((vocab: Vocabulary) => (
                    <div
                        key={vocab.id}
                        className="border rounded-lg p-4 cursor-pointer hover:bg-muted"
                        onClick={() => navigate(`/vocabulary/${vocab.id}`)}
                    >
                        <p className="font-medium">{vocab.word}</p>
                        <p className="text-muted-foreground">{vocab.translation}</p>
                        <p className="text-muted-foreground">{vocab.context_sentence}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default VocabularyPage