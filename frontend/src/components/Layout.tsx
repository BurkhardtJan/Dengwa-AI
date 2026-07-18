import {NavLink, Outlet, useNavigate} from 'react-router-dom'
import {useState} from 'react'
import {fetchLanguages} from '@/services/language.service'
import {useQuery} from '@tanstack/react-query'
import {useLanguage} from '@/context/TargetLanguageContext.tsx'
import CreateLanguageModal from '@/components/CreateLanguageModal'
import {LanguageSwitcher} from '../components/LanguageSwitcher';
import {useTranslation} from 'react-i18next'

function Layout() {
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const {selectedLan, setSelectedLan} = useLanguage()
    const [showCreate, setShowCreate] = useState(false)
    const {t} = useTranslation()
    const {data: languages} = useQuery({
        queryKey: ['languages'],
        queryFn: fetchLanguages
    })


    function handleLogout() {
        localStorage.removeItem('token')
        navigate('/login')
    }

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Overlay für Mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-10 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed md:static inset-y-0 left-0 z-20
        w-64 border-r p-6 flex flex-col gap-2
        bg-background transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
                <h2 className="text-xl font-bold mb-6">Dengwa AI</h2>
                <NavLink
                    to="/dashboard"
                    onClick={() => setSidebarOpen(false)}
                    className={({isActive}) =>
                        `px-4 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`
                    }
                >
                    {t('nav.dashboard')}
                </NavLink>
                <NavLink
                    to="/vocabulary"
                    onClick={() => setSidebarOpen(false)}
                    className={({isActive}) =>
                        `px-4 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`
                    }
                >
                    {t('nav.vocabulary')}
                </NavLink>
                <NavLink
                    to="/review"
                    onClick={() => setSidebarOpen(false)}
                    className={({isActive}) =>
                        `px-4 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`
                    }
                >
                    {t('nav.review')}
                </NavLink>
                <NavLink
                    to="/media"
                    onClick={() => setSidebarOpen(false)}
                    className={({isActive}) =>
                        `px-4 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`
                    }
                >
                    {t('nav.media')}
                </NavLink>
                <NavLink
                    to="/chat"
                    onClick={() => setSidebarOpen(false)}
                    className={({isActive}) =>
                        `px-4 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`
                    }
                >
                    {t('nav.chats')}
                </NavLink>
                <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2 px-4">{t('targetLanguage')}</p>
                    <select
                        value={selectedLan ?? ''}
                        onChange={e => {
                            if (e.target.value === '__add__') {
                                setShowCreate(true)
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
                <div className="mt-auto flex flex-col gap-2">
                    <LanguageSwitcher/>
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 rounded-lg text-sm border hover:bg-muted"
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center p-4 border-b">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg hover:bg-muted"
                    >
                        ☰
                    </button>
                    <span className="ml-4 font-bold">Dengwa AI</span>
                </header>
                <main className="flex-1 p-8 overflow-y-auto">
                    <Outlet/>
                </main>
            </div>
            {showCreate && (
                <CreateLanguageModal onClose={() => setShowCreate(false)}/>
            )}
        </div>
    )
}

export default Layout