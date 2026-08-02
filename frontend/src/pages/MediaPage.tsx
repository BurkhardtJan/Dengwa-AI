import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useQuery} from '@tanstack/react-query'
import {fetchMedia} from "@/services/media.service.ts"
import type {components} from '../types/api'
import {useLanguage} from "@/context/TargetLanguageContext.tsx"
import {getLanguageDisplayName} from '@/lib/languages'
import {useTranslation} from 'react-i18next'
import CreateMediaModal from '@/components/CreateMediaModal'

type Media = components['schemas']['MediaResponse']

function MediaPage() {
    const navigate = useNavigate()
    const {selectedLan} = useLanguage()
    const {t, i18n} = useTranslation(['media', 'common'])
    const [showForm, setShowForm] = useState(false)

    const {data, isLoading, isError} = useQuery({
        queryKey: ['media', selectedLan],
        queryFn: () => fetchMedia(selectedLan ?? undefined)
    })

    if (isLoading) return <p className="p-8">{t('common:loading')}</p>
    if (isError) return <p className="p-8 text-destructive">{t('common:errorLoading')}</p>

    return (
        <div className="min-h-screen p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">{t('common:nav.media')}</h1>
                {selectedLan && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        {t('addButton')}
                    </button>
                )}
            </div>

            <div className="grid gap-4">
                {(data ?? []).length === 0 ? (
                    <p className="text-muted-foreground text-sm italic">
                        {selectedLan
                            ? t('noMedia', {language: getLanguageDisplayName(selectedLan, i18n.language)})
                            : t('common:noLanguageSelected')}
                    </p>
                ) : (
                    (data ?? []).map((media: Media) => (
                        <div
                            key={media.id}
                            className="border rounded-lg p-4 cursor-pointer hover:bg-muted"
                            onClick={() => navigate(`/media/${media.id}`)}
                        >
                            <p className="font-medium">{media.title}</p>
                        </div>
                    ))
                )}
            </div>

            {showForm && (
                <CreateMediaModal onClose={() => setShowForm(false)}/>
            )}
        </div>
    )
}

export default MediaPage