import {createContext, useContext, type ReactNode} from 'react'
import type {ChatAdapter} from '@/components/chat/chat.types'
import {dengwaChatAdapter} from '@/services/chat.service'

const ChatAdapterCtx = createContext<ChatAdapter>(dengwaChatAdapter)

interface Props {
    adapter?: ChatAdapter
    children: ReactNode
}

export function ChatAdapterProvider({adapter, children}: Props) {
    return (
        <ChatAdapterCtx.Provider value={adapter ?? dengwaChatAdapter}>
            {children}
        </ChatAdapterCtx.Provider>
    )
}

export function useChatAdapter(): ChatAdapter {
    return useContext(ChatAdapterCtx)
}