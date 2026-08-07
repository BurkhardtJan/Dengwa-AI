import {createContext, useContext, useState} from 'react'
import type {ReactNode} from 'react'

const DEFAULT_PROVIDER_KEY = 'chat.defaultProvider'
const DEFAULT_MODEL_KEY = 'chat.defaultModel'
const DEFAULT_EMBEDDING_MODEL_KEY = 'chat.defaultEmbeddingModel'

type ChatDefaultsContextType = {
    defaultProvider: string | null
    defaultModel: string | null
    defaultEmbeddingModel: string | null
    setDefaultProvider: (provider: string | null) => void
    setDefaultModel: (model: string | null) => void
    setDefaultEmbeddingModel: (embeddingModel: string | null) => void
}

const ChatDefaultsContext = createContext<ChatDefaultsContextType | null>(null)

export function ChatDefaultsProvider({children}: { children: ReactNode }) {
    const [defaultProvider, setDefaultProviderState] = useState<string | null>(
        () => localStorage.getItem(DEFAULT_PROVIDER_KEY)
    )
    const [defaultModel, setDefaultModelState] = useState<string | null>(
        () => localStorage.getItem(DEFAULT_MODEL_KEY)
    )
    const [defaultEmbeddingModel, setDefaultEmbeddingModelState] = useState<string | null>(
        () => localStorage.getItem(DEFAULT_EMBEDDING_MODEL_KEY)
    )

    function setDefaultProvider(provider: string | null) {
        if (provider) localStorage.setItem(DEFAULT_PROVIDER_KEY, provider)
        else localStorage.removeItem(DEFAULT_PROVIDER_KEY)
        setDefaultProviderState(provider)
        // Changing the provider invalidates whatever model was picked for the old one.
        localStorage.removeItem(DEFAULT_MODEL_KEY)
        setDefaultModelState(null)
    }

    function setDefaultModel(model: string | null) {
        if (model) localStorage.setItem(DEFAULT_MODEL_KEY, model)
        else localStorage.removeItem(DEFAULT_MODEL_KEY)
        setDefaultModelState(model)
    }

    function setDefaultEmbeddingModel(embeddingModel: string | null) {
        if (embeddingModel) localStorage.setItem(DEFAULT_EMBEDDING_MODEL_KEY, embeddingModel)
        else localStorage.removeItem(DEFAULT_EMBEDDING_MODEL_KEY)
        setDefaultEmbeddingModelState(embeddingModel)
    }

    return (
        <ChatDefaultsContext.Provider value={{
            defaultProvider, defaultModel, defaultEmbeddingModel,
            setDefaultProvider, setDefaultModel, setDefaultEmbeddingModel,
        }}>
            {children}
        </ChatDefaultsContext.Provider>
    )
}

export function useChatDefaults() {
    const ctx = useContext(ChatDefaultsContext)
    if (!ctx) throw new Error('useChatDefaults must be used within ChatDefaultsProvider')
    return ctx
}