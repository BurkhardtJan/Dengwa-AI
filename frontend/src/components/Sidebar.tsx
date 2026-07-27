import {NavLink, useNavigate} from 'react-router-dom'
import {useState} from 'react'
import {useQuery} from '@tanstack/react-query'
import {fetchLanguages} from '@/services/language.service'
import {fetchMedia} from '@/services/media.service'
import {useLanguage} from '@/context/TargetLanguageContext.tsx'
import {useMedium} from '@/context/MediumContext'
import CreateLanguageModal from '@/components/CreateLanguageModal'
import CreateMediaModal from '@/components/CreateMediaModal'
import {LanguageSwitcher} from './LanguageSwitcher'
import {useTranslation} from 'react-i18next'

type Props = {
    isOpen: boolean
    onNavigate: () => void
}

const NAV_ITEMS = [
    {to: '/dashboard', labelKey: 'nav.dashboard'},
    {to: '/vocabulary', labelKey: 'nav.vocabulary'},
    {to: '/review', labelKey: 'nav.review'},
    {to: '/media', labelKey: 'nav.media'},
    {to: '/chat', labelKey: 'nav.chats'},
]

function Sidebar({isOpen, onNavigate}: Props) {
    const navigate = useNavigate()
    const {t} = useTranslation()
    const {selectedLan, setSelectedLan} = useLanguage()
    const {mediumId, setMediumId} = useMedium()
    const [showCreateLanguage, setShowCreateLanguage] = useState(false)
    const [showCreateMedia, setShowCreateMedia] = useState(false)

    const {data: languages} = useQuery({
        queryKey: ['languages'],
        queryFn: fetchLanguages
    })

    const {data: media} = useQuery({
        queryKey: ['media', 'list', selectedLan],
        queryFn: () => fetchMedia(selectedLan ?? undefined),
        enabled: !!selectedLan,
    })

    function handleLogout() {
        localStorage.removeItem('token')
        navigate('/login')
    }

    return (
        <>
            <aside className={`
                fixed md:static inset-y-0 left-0 z-20
                w-64 border-r p-6 flex flex-col gap-2
                bg-background transition-transform duration-200
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
            `}>
                <h2 className="text-xl font-bold mb-6">Dengwa AI</h2>

                {NAV_ITEMS.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onNavigate}
                        className={({isActive}) =>
                            `px-4 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`
                        }
                    >
                        {t(item.labelKey)}
                    </NavLink>
                ))}

                <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2 px-4">{t('targetLanguage')}</p>
                    <select
                        value={selectedLan ?? ''}
                        onChange={e => {
                            if (e.target.value === '__add__') {
                                setShowCreateLanguage(true)
                            } else {
                                setSelectedLan(e.target.value)
                            }
                        }}
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    >
                        <option value="" disabled>{t('selectLanguage')}.</option>
                        {languages?.map(lan => (
                            <option key={lan.id} value={lan.learning_language}>
                                {lan.learning_language}
                            </option>
                        ))}
                        <option value="__add__" className="text-primary">
                            {t('addLanguage')}
                        </option>
                    </select>
                </div>

                {/* Only shown once a language is picked — a medium can't exist without one anyway */}
                {selectedLan && (
                    <div className="mt-4">
                        <p className="text-xs text-muted-foreground mb-2 px-4">{t('medium')}</p>
                        <select
                            value={mediumId ?? ''}
                            onChange={e => {
                                if (e.target.value === '__add__') {
                                    setShowCreateMedia(true)
                                } else {
                                    setMediumId(e.target.value || null)
                                }
                            }}
                            className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                        >
                            <option value="">{t('allMedia')}</option>
                            {media?.map(m => (
                                <option key={m.id} value={m.id}>{m.title}</option>
                            ))}
                            <option value="__add__" className="text-primary">
                                {t('addMedium')}
                            </option>
                        </select>
                    </div>
                )}

                <div className="mt-auto flex flex-col gap-2">
                    <LanguageSwitcher/>
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 rounded-lg text-sm border hover:bg-muted"
                    >
                        {t('logout')}
                    </button>
                </div>
            </aside>

            {showCreateLanguage && (
                <CreateLanguageModal onClose={() => setShowCreateLanguage(false)}/>
            )}
            {showCreateMedia && (
                <CreateMediaModal onClose={() => setShowCreateMedia(false)}/>
            )}
        </>
    )
}

export default Sidebar