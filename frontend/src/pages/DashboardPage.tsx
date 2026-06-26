import {useState} from 'react'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {fetchMe} from '../services/user.service'
import {deleteLanguage, fetchLanguages, updateLanguage} from "@/services/language.service.ts"
import {useLanguage} from '@/context/TargetLanguageContext.tsx'
import type {components} from '../types/api'
import Modal from '../components/Modal'
import CreateLanguageModal from '@/components/CreateLanguageModal'

type Languages = components['schemas']['LanguageLearningResponse']

function DashboardPage() {
    const queryClient = useQueryClient()
    const {selectedLan: globalLan, setSelectedLan: setGlobalLan} = useLanguage()
    const [selectedLan, setSelectedLan] = useState<Languages | null>(null)
    const [editing, setEditing] = useState(false)
    const [proficiencyLevel, setProficiencyLevel] = useState('')
    const [userMotivation, setUserMotivation] = useState('')
    const [showCreate, setShowCreate] = useState(false)

    const {data, isLoading, isError} = useQuery({
        queryKey: ['me'],
        queryFn: fetchMe
    })

    const {data: languages} = useQuery({
        queryKey: ['languages'],
        queryFn: fetchLanguages
    })

    const updateMutation = useMutation({
        mutationFn: () => updateLanguage(selectedLan!.learning_language, {
            proficiency_level: proficiencyLevel,
            user_motivation: userMotivation
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['languages']})
            setEditing(false)
            setSelectedLan(null)
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (lan: string) => deleteLanguage(lan),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['languages']})
            setSelectedLan(null)
            if (globalLan === selectedLan?.learning_language) {
                setGlobalLan(null)
            }
        }
    })

    if (isLoading) return <p className="p-8">Lädt...</p>
    if (isError) return <p className="p-8 text-destructive">Fehler beim Laden</p>

    return (
        <div className="min-h-screen p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Willkommen zurück, {data.username}!</p>
                    <p>Muttersprache: <span className="font-medium text-foreground">{data.native_language}</span></p>

                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    + Sprache hinzufügen
                </button>
            </div>
            

            <h2 className="text-xl font-semibold mb-4">Deine Lernsprachen:</h2>

            <div className="grid gap-3">
                {(languages ?? []).length === 0 ? (
                    <p className="text-muted-foreground text-sm italic">
                        Du hast noch keine Lernsprachen hinzugefügt. Klicke auf "+ Sprache hinzufügen".
                    </p>
                ) : (
                    (languages ?? []).map((lan: Languages) => (
                        <div
                            key={lan.id}
                            className={`border rounded-lg p-4 cursor-pointer hover:bg-muted transition-colors flex justify-between items-center ${
                                globalLan === lan.learning_language ? 'border-primary bg-primary/5' : ''
                            }`}
                            onClick={() => {
                                setSelectedLan(lan)
                                setProficiencyLevel(lan.proficiency_level)
                                setUserMotivation(lan.user_motivation ?? '')
                            }}
                        >
                            <div>
                                <p className="font-medium text-lg">{lan.learning_language}</p>
                                <p className="text-sm text-muted-foreground mt-0.5">Level: {lan.proficiency_level}</p>
                            </div>
                            {globalLan === lan.learning_language && (
                                <span
                                    className="text-xs px-2.5 py-1 bg-primary text-primary-foreground rounded-full font-medium">
                                    Aktiv ausgewählt
                                </span>
                            )}
                        </div>
                    ))
                )}
            </div>

            {selectedLan && (
                <Modal onClose={() => {
                    setSelectedLan(null);
                    setEditing(false)
                }}>
                    <h2 className="text-lg font-bold mb-4">{selectedLan.learning_language}</h2>
                    {editing ? (
                        <div className="flex flex-col gap-3">
                            <label className="text-xs font-medium text-muted-foreground -mb-1">Sprachniveau (z.B. A2,
                                B1)</label>
                            <input
                                value={proficiencyLevel}
                                onChange={e => setProficiencyLevel(e.target.value)}
                                placeholder="Level"
                                className="border rounded-lg px-3 py-2 bg-background text-sm"
                            />
                            <label className="text-xs font-medium text-muted-foreground -mb-1">Deine Motivation</label>
                            <input
                                value={userMotivation}
                                onChange={e => setUserMotivation(e.target.value)}
                                placeholder="Motivation"
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
                                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium"
                                >
                                    Speichern
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3 mb-6">
                                <p className="text-sm">
                                    <span className="text-muted-foreground block text-xs">Aktuelles Niveau:</span>
                                    <span className="font-medium text-base">{selectedLan.proficiency_level}</span>
                                </p>
                                {selectedLan.user_motivation && (
                                    <p className="text-sm">
                                        <span className="text-muted-foreground block text-xs">Motivation:</span>
                                        <span className="italic">"{selectedLan.user_motivation}"</span>
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2 justify-end border-t pt-4">
                                <button
                                    onClick={() => {
                                        if (confirm('Möchtest du diese Sprache wirklich unwiderruflich löschen? Alle verknüpften Medien, Chats und Vokabelzuordnungen könnten verloren gehen.')) {
                                            deleteMutation.mutate(selectedLan.learning_language)
                                        }
                                    }}
                                    className="text-destructive border border-destructive/30 px-4 py-2 rounded-lg text-sm hover:bg-destructive/5 transition-colors mr-auto"
                                >
                                    Löschen
                                </button>
                                <button
                                    onClick={() => setEditing(true)}
                                    className="border px-4 py-2 rounded-lg text-sm hover:bg-muted"
                                >
                                    Bearbeiten
                                </button>
                                <button
                                    onClick={() => {
                                        setGlobalLan(selectedLan.learning_language)
                                        setSelectedLan(null)
                                    }}
                                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium"
                                >
                                    Aktivieren
                                </button>
                            </div>
                        </>
                    )}
                </Modal>
            )}

            {showCreate && (
                <CreateLanguageModal onClose={() => setShowCreate(false)}/>
            )}
        </div>
    )
}

export default DashboardPage;