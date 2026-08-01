import {useState} from 'react'
import {useMutation, useQueryClient} from '@tanstack/react-query'
import {uploadMedia} from '@/services/media.service'
import Modal from './Modal'
import {useLanguage} from '@/context/TargetLanguageContext.tsx'
import {useMedium} from '@/context/MediumContext'
import {useTranslation} from 'react-i18next'

type Props = {
    onClose: () => void
}

function CreateMediaModal({onClose}: Props) {
    const [title, setTitle] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const {selectedLan} = useLanguage()
    const {setMediumId} = useMedium()
    const {t} = useTranslation(['common', 'media'])
    const queryClient = useQueryClient()

    const createMutation = useMutation({
        mutationFn: () => uploadMedia(selectedLan!, file!, title),
        onSuccess: (newMedia) => {
            queryClient.invalidateQueries({queryKey: ['media']})
            setTitle('')
            setFile(null)
            setMediumId(newMedia.id)   // new medium becomes the active filter right away
            onClose()
        }
    })

    return (
        <Modal onClose={onClose}>
            <h2 className="text-lg font-bold mb-4">{t('media:newMedia')}</h2>
            <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={t('media:titlePlaceholder')}
                className="border rounded-lg px-3 py-2 w-full mb-4"
            />
            <input
                type="file"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                className="border rounded-lg px-3 py-2 w-full mb-4"
            />
            <button
                onClick={() => createMutation.mutate()}
                disabled={!file || createMutation.isPending}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg disabled:opacity-50"
            >
                {createMutation.isPending ? t('media:uploading') : t('common:buttons.save')}
            </button>
        </Modal>
    )
}

export default CreateMediaModal