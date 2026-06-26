import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

type LanguageContextType = {
    selectedLan: string | null
    setSelectedLan: (lan: string | null) => void
}

const TargetLanguageContext = createContext<LanguageContextType | null>(null)

export function TargetLanguageProvider({ children }: { children: ReactNode }) {
    const [selectedLan, setSelectedLan] = useState<string | null>(null)

    return (
        <TargetLanguageContext.Provider value={{ selectedLan, setSelectedLan }}>
            {children}
        </TargetLanguageContext.Provider>
    )
}

export function useLanguage() {
    const ctx = useContext(TargetLanguageContext)
    if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
    return ctx
}