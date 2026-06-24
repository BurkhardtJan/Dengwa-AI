import {useState, useEffect} from 'react'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {useNavigate} from 'react-router-dom'
import {fetchMe} from '../services/user.service'
import {deleteLanguage, fetchLanguages, updateLanguage} from "@/services/language.service.ts";
import type {components} from '../types/api'
import Modal from '../components/Modal'


type Languages = components['schemas']['LanguageLearningResponse']

function DashboardPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const [selectedLan, setSelectedLan] = useState<Languages | null>(null)
    const [editing, setEditing] = useState(false)
    const [proficiencyLevel, setProficiencyLevel] = useState('')
    const [userMotivation, setUserMotivation] = useState('')

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
        }
    })


    if (isLoading) return <p className="p-8">Lädt...</p>
    if (isError) return <p className="p-8 text-red-500">Fehler beim Laden</p>

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Dashboard</h1>
            </div>
            <p className="text-muted-foreground">Willkommen, {data.username}!</p>
            <p className="text-muted-foreground">Muttersprache: {data.native_language}</p>
            <p className="text-2xl">Lernsprachen:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(languages ?? []).map((lan: Languages) => (
                    <div
                        key={lan.id}
                        className="border rounded-lg p-4 cursor-pointer hover:bg-muted"
                        onClick={() => setSelectedLan(lan)}
                    >
                        <p className="font-medium">{lan.learning_language}</p>
                    </div>
                ))}
            </div>
            {selectedLan && (
                <Modal onClose={() => {
                    setSelectedLan(null);
                    setEditing(false)
                }}>
                    <h2 className="text-lg font-bold mb-4">{selectedLan.learning_language}</h2>
                    {editing ? (
                        <div className="flex flex-col gap-3">
                            <input
                                value={proficiencyLevel}
                                onChange={e => setProficiencyLevel(e.target.value)}
                                placeholder="Level"
                                className="border rounded-lg px-3 py-2"
                            />
                            <input
                                value={userMotivation}
                                onChange={e => setUserMotivation(e.target.value)}
                                placeholder="Motivation"
                                className="border rounded-lg px-3 py-2"
                            />
                            <div className="flex gap-2">
                                <button onClick={() => updateMutation.mutate()}
                                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg">
                                    Speichern
                                </button>
                                <button onClick={() => setEditing(false)}
                                        className="border px-4 py-2 rounded-lg">
                                    Abbrechen
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-lg mb-4">Level: {selectedLan.proficiency_level}</p>
                            {selectedLan.user_motivation &&
                                <p className="text-lg mb-4">Motivation: {selectedLan.user_motivation}</p>}
                            <div className="flex gap-2">
                                <button onClick={() => setEditing(true)}
                                        className="border px-4 py-2 rounded-lg">
                                    Bearbeiten
                                </button>
                                <button onClick={() => deleteMutation.mutate(selectedLan.learning_language)}
                                        className="text-red-500 border border-red-500 px-4 py-2 rounded-lg">
                                    Löschen
                                </button>
                            </div>
                        </>
                    )}
                </Modal>
            )}
        </div>


    )
}

export default DashboardPage