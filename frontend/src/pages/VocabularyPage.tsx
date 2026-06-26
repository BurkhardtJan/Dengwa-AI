import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import Modal from '../components/Modal'
import {fetchVocabularies, createVocabulary} from '../services/vocabulary.service'
import type {components} from '../types/api'
import {useLanguage} from "@/context/TargetLanguageContext.tsx";

type Vocabulary = components['schemas']['VocabularyResponse']
type VocabularyCreate = components['schemas']['VocabularyCreate']

function VocabularyPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const {selectedLan} = useLanguage()
    const [newWord, setNewWord] = useState('')
    const [newTranslation, setNewTranslation] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [newContextSentence, setNewContextSentence] = useState('')

    const {data, isLoading, isError} = useQuery({
        queryKey: ['vocabularies', selectedLan],
        queryFn: () => fetchVocabularies(selectedLan ?? undefined)
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
    if (isError) return <p className="p-8 text-destructive">Fehler beim Laden</p>

    return (
        <div className="min-h-screen p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Vokabeln</h1>

                {selectedLan && (
                    <button
                        onClick={() => setShowForm(v => !v)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        + Vokabel hinzufügen
                    </button>
                )}
            </div>

            <div className="grid gap-4">
                {(data ?? []).length === 0 ? (
                        <p className="text-muted-foreground text-sm italic">
                            {selectedLan
                                ? `Noch keine Vokabeln für ${selectedLan} vorhanden. Klicke auf "+ Vokabel hinzufügen".`
                                : 'Bitte wähle zuerst eine Sprache in der Sidebar aus.'}
                        </p>
                    ) :
                    (data ?? []).map((vocab: Vocabulary) => (
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
            {showForm && (
                <Modal onClose={() => setShowForm(false)}>
                    <h2 className="text-lg font-bold mb-4">Neue Vokabel</h2>
                    <div className="flex flex-col gap-3">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Wort /
                                Ausdruck</label>
                            <input
                                value={newWord}
                                onChange={e => setNewWord(e.target.value)}
                                placeholder="z.B. ephemeral"
                                className="border rounded-lg px-3 py-2 bg-background text-sm w-full"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Übersetzung</label>
                            <input
                                value={newTranslation}
                                onChange={e => setNewTranslation(e.target.value)}
                                placeholder="z.B. vergänglich"
                                className="border rounded-lg px-3 py-2 bg-background text-sm w-full"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Beispielsatz
                                (optional)</label>
                            <input
                                value={newContextSentence}
                                onChange={e => setNewContextSentence(e.target.value)}
                                placeholder="z.B. The ephemeral beauty of cherry blossoms..."
                                className="border rounded-lg px-3 py-2 bg-background text-sm w-full"
                            />
                        </div>
                        <div className="flex gap-2 justify-end mt-2">
                            <button
                                onClick={() => setShowForm(false)}
                                className="border px-4 py-2 rounded-lg text-sm hover:bg-muted"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={() => createMutation.mutate({
                                    word: newWord,
                                    translation: newTranslation,
                                    context_sentence: newContextSentence || undefined
                                })}
                                disabled={!newWord || createMutation.isPending}
                                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                            >
                                {createMutation.isPending ? 'Speichert...' : 'Speichern'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}

export default VocabularyPage