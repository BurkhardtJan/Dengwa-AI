import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import Modal from '../components/Modal'
import {fetchLanguages} from "../services/language.service.ts";
import {fetchVocabularies, createVocabulary} from '../services/vocabulary.service'
import type {components} from '../types/api'
import {useLanguage} from "@/context/LanguageContext.tsx";

type Vocabulary = components['schemas']['VocabularyResponse']
type VocabularyCreate = components['schemas']['VocabularyCreate']

function VocabularyPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const {selectedLan, setSelectedLan} = useLanguage()
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

            <div className="grid gap-4">
                {selectedLan && (
                    <div onClick={() => setShowForm(v => !v)} className="border rounded-lg p-4 cursor-pointer hover:bg-muted">
                        <p className="font-medium">{selectedLan}</p>
                        <p className="text-muted-foreground">Vokabel hinzufügen</p>
                    </div>
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