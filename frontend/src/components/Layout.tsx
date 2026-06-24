import {NavLink, Outlet, useNavigate} from 'react-router-dom'
import {useState} from 'react'
import {createLanguage, fetchLanguages} from '@/services/language.service'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {useLanguage} from '@/context/LanguageContext'
import CreateLanguageModal from '@/components/CreateLanguageModal'

function Layout() {
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const {selectedLan, setSelectedLan} = useLanguage()
    const [newLan, setNewLan] = useState('')
    const [showCreate, setShowCreate] = useState(false)
    const {data: languages} = useQuery({
        queryKey: ['languages'],
        queryFn: fetchLanguages
    })
    const queryClient = useQueryClient()

    const createMutation = useMutation({
        mutationFn: (lan: string) => createLanguage({learning_language: lan}),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['languages']})
            setNewLan('')
            setShowCreate(false)
        }
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
                <h2 className="text-xl font-bold mb-6">Immersio AI</h2>
                <NavLink
                    to="/dashboard"
                    onClick={() => setSidebarOpen(false)}
                    className={({isActive}) =>
                        `px-4 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`
                    }
                >
                    Dashboard
                </NavLink>
                <NavLink
                    to="/vocabulary"
                    onClick={() => setSidebarOpen(false)}
                    className={({isActive}) =>
                        `px-4 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`
                    }
                >
                    Vokabeln
                </NavLink>
                <NavLink
                    to="/media"
                    onClick={() => setSidebarOpen(false)}
                    className={({isActive}) =>
                        `px-4 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`
                    }
                >
                    Medien
                </NavLink>
                <NavLink
                    to="/chat"
                    onClick={() => setSidebarOpen(false)}
                    className={({isActive}) =>
                        `px-4 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`
                    }
                >
                    Chats
                </NavLink>
                <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2 px-4">Lernsprache</p>
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
                        <option value="" disabled>Sprache wählen...</option>
                        {languages?.map(lan => (
                            <option key={lan.id} value={lan.learning_language}>
                                {lan.learning_language}
                            </option>
                        ))}
                        <option value="__add__" className="text-primary">
                            + Sprache hinzufügen
                        </option>
                    </select>
                </div>
                <div className="mt-auto">
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
                    <span className="ml-4 font-bold">Immersio AI</span>
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