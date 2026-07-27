import {Outlet} from 'react-router-dom'
import {useState} from 'react'
import Sidebar from '@/components/Sidebar'

function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex h-screen overflow-hidden">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-10 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)}/>

            <div className="flex-1 flex flex-col overflow-hidden">
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
        </div>
    )
}

export default Layout