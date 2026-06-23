import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

type LanguageContextType = {
    selectedLan: string | null
    setSelectedLan: (lan: string | null) => void
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [selectedLan, setSelectedLan] = useState<string | null>(null)

    return (
        <LanguageContext.Provider value={{ selectedLan, setSelectedLan }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const ctx = useContext(LanguageContext)
    if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
    return ctx
}