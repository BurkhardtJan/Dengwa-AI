import {useState} from 'react'
import {createLanguage} from '@/services/language.service'
import {useMutation, useQueryClient} from '@tanstack/react-query'
import Modal from '../components/Modal'
import {useLanguage} from "@/context/TargetLanguageContext.tsx";


type Props = {
    onClose: () => void
}

function CreateLanguageModal({onClose}: Props) {
    const [newLan, setNewLan] = useState('')
    const [lanLevel, setLanLevel] = useState('')
    const [lanMotivation, setLanMotivation] = useState('')
    const {setSelectedLan} = useLanguage()


    const queryClient = useQueryClient()

    const createMutation = useMutation({
        mutationFn: () => createLanguage({
            learning_language: newLan,
            proficiency_level: lanLevel || 'A1',
            user_motivation: lanMotivation
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['languages']})
            setNewLan('')
            setSelectedLan(newLan)
            onClose()
        }
    })


    return (
        <Modal onClose={onClose}>
            <h2 className="text-lg font-bold mb-4">Neue Sprache</h2>
            <input
                value={newLan}
                onChange={e => setNewLan(e.target.value)}
                placeholder="z.B. English"
                className="border rounded-lg px-3 py-2 w-full mb-4"
            />
            <input
                value={lanLevel}
                onChange={e => setLanLevel(e.target.value)}
                placeholder="z.B. A1"
                className="border rounded-lg px-3 py-2 w-full mb-4"
            />
            <input
                value={lanMotivation}
                onChange={e => setLanMotivation(e.target.value)}
                placeholder="z.B. Just for Fun"
                className="border rounded-lg px-3 py-2 w-full mb-4"
            />
            <button
                onClick={() => createMutation.mutate()}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg"
            >
                Hinzufügen
            </button>
        </Modal>
    )
}

export default CreateLanguageModal