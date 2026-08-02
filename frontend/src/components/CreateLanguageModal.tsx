import {useState} from 'react'
import {createLanguage} from '@/services/language.service'
import {useMutation, useQueryClient} from '@tanstack/react-query'
import Modal from '../components/Modal'
import LanguagePickerModal from '@/components/LanguagePickerModal'
import {useLanguage} from "@/context/TargetLanguageContext.tsx";
import {useMedium} from '@/context/MediumContext'
import {useTranslation} from 'react-i18next'
import {CURATED_LANGUAGE_CODES, getLanguageDisplayName} from '@/lib/languages'


type Props = {
    onClose: () => void
}

function CreateLanguageModal({onClose}: Props) {
    const [newLan, setNewLan] = useState('')
    const [lanLevel, setLanLevel] = useState('')
    const [lanMotivation, setLanMotivation] = useState('')
    const [showPicker, setShowPicker] = useState(false)
    const {setSelectedLan} = useLanguage()
    const {setMediumId} = useMedium()

    const {t, i18n} = useTranslation(['common', 'dashboard'])


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
            setMediumId(null)
            onClose()
        }
    })


    return (
        <Modal onClose={onClose}>
            <h2 className="text-lg font-bold mb-4">{t('common:addLanguage')}</h2>
            <select
                value={CURATED_LANGUAGE_CODES.includes(newLan as typeof CURATED_LANGUAGE_CODES[number]) ? newLan : ''}
                onChange={e => {
                    if (e.target.value === '__all__') {
                        setShowPicker(true)
                    } else {
                        setNewLan(e.target.value)
                    }
                }}
                className="border rounded-lg px-3 py-2 w-full mb-4 bg-background"
            >
                <option value="" disabled>{t('common:targetLanguage')}</option>
                {CURATED_LANGUAGE_CODES.map(code => (
                    <option key={code} value={code}>{getLanguageDisplayName(code, i18n.language)}</option>
                ))}
                <option value="__all__" className="text-primary">{t('common:languagePicker.allLanguages')}</option>
            </select>
            {newLan && !CURATED_LANGUAGE_CODES.includes(newLan as typeof CURATED_LANGUAGE_CODES[number]) && (
                <p className="text-xs text-muted-foreground -mt-3 mb-4 px-1">
                    {t('common:languagePicker.selected')}: <span
                    className="font-medium">{getLanguageDisplayName(newLan, i18n.language)}</span>
                </p>
            )}
            <input
                value={lanLevel}
                onChange={e => setLanLevel(e.target.value)}
                placeholder={t('dashboard:levelPlaceholder')}
                className="border rounded-lg px-3 py-2 w-full mb-4"
            />
            <input
                value={lanMotivation}
                onChange={e => setLanMotivation(e.target.value)}
                placeholder={t('dashboard:motivationLabel')}
                className="border rounded-lg px-3 py-2 w-full mb-4"
            />
            <button
                onClick={() => createMutation.mutate()}
                disabled={!newLan}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg disabled:opacity-50"
            >
                {t('common:buttons.add')}
            </button>

            {showPicker && (
                <LanguagePickerModal
                    onClose={() => setShowPicker(false)}
                    onSelect={(value) => {
                        setNewLan(value)
                        setShowPicker(false)
                    }}
                />
            )}
        </Modal>
    )
}

export default CreateLanguageModal