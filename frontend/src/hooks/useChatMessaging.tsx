import {useState} from 'react'
import {useQueryClient} from '@tanstack/react-query'
import {streamMessage, streamResponse, createResponse, writeMessage} from '@/services/chat.service.ts'
import type {components} from '@/types/api'

type ChatMessage = components['schemas']['ChatMessageResponse']
type Chat = components['schemas']['ChatResponse']

export interface ModelChoice {
    provider: string | null
    model: string | null
    embeddingModel: string | null
}

export type ViewMode = 'switch' | 'sbs'

const EMPTY_CHOICE: ModelChoice = {provider: null, model: null, embeddingModel: null}
const VIEW_MODE_KEY = 'dengwa-chat-view-mode'

export function useChatMessaging(chatId: string | undefined, onNewLeaf: (id: string) => void) {
    const queryClient = useQueryClient()
    const [configs, setConfigs] = useState<ModelChoice[]>([EMPTY_CHOICE])
    const [pendingUserText, setPendingUserText] = useState<string | null>(null)
    const [pendingReplyForId, setPendingReplyForId] = useState<string | null>(null)
    const [streamingText, setStreamingText] = useState<string | null>(null)
    const [isSending, setIsSending] = useState(false)
    const [isRegenerating, setIsRegenerating] = useState(false)

    const [viewMode, setViewModeState] = useState<ViewMode>(() => {
        const stored = localStorage.getItem(VIEW_MODE_KEY)
        return stored === 'sbs' ? 'sbs' : 'switch'
    })
    const setViewMode = (mode: ViewMode) => {
        setViewModeState(mode)
        localStorage.setItem(VIEW_MODE_KEY, mode)
    }

    async function send(message: string, parentId: string | null) {
        const [primary, ...extra] = configs.length > 0 ? configs : [EMPTY_CHOICE]
        let persistedUserMessage: ChatMessage | null = null

        setIsSending(true)
        setPendingUserText(message)
        setStreamingText('')

        try {
            for await (const event of streamMessage(
                chatId!, message, parentId,
                primary.provider, primary.model, primary.embeddingModel
            )) {
                if (event.type === 'user_message') {
                    persistedUserMessage = event.message
                } else if (event.type === 'chunk') {
                    setStreamingText(prev => (prev ?? '') + event.content)
                } else if (event.type === 'done') {
                    onNewLeaf(event.message.id)
                } else if (event.type === 'title') {
                    queryClient.setQueryData(['chatMeta', chatId], (old: Chat | undefined) =>
                        old ? {...old, title: event.title} : old
                    )
                    void queryClient.invalidateQueries({queryKey: ['chat']})
                }
            }

            // Compare-view extras stay request/response for now — kein Streaming dort
            if (extra.length > 0 && persistedUserMessage) {
                const userMessageId = persistedUserMessage.id
                await Promise.all(
                    extra.map(cfg => createResponse(chatId!, userMessageId, cfg.provider, cfg.model, cfg.embeddingModel))
                )
            }
        } finally {
            await queryClient.invalidateQueries({queryKey: ['chatHistory', chatId]})
            setIsSending(false)
            setPendingUserText(null)
            setStreamingText(null)
        }
    }

    async function sendWithContext(message: string, context: string, parentId: string | null) {
        const contextNode = await writeMessage(chatId!, context, 'context', parentId)
        await send(message, contextNode.id)
    }

    async function regenerate(userMessageId: string) {
        const primary = configs[0] ?? EMPTY_CHOICE

        setIsRegenerating(true)
        setPendingReplyForId(userMessageId)
        setStreamingText('')

        try {
            for await (const event of streamResponse(
                chatId!, userMessageId,
                primary.provider, primary.model, primary.embeddingModel
            )) {
                if (event.type === 'chunk') {
                    setStreamingText(prev => (prev ?? '') + event.content)
                } else if (event.type === 'done') {
                    onNewLeaf(event.message.id)
                }
            }
        } finally {
            await queryClient.invalidateQueries({queryKey: ['chatHistory', chatId]})
            setIsRegenerating(false)
            setPendingReplyForId(null)
            setStreamingText(null)
        }
    }

    const addConfig = () => setConfigs(prev => [...prev, EMPTY_CHOICE])
    const removeConfig = (index: number) => setConfigs(prev => prev.filter((_, i) => i !== index))
    const updateConfig = (index: number, choice: ModelChoice) =>
        setConfigs(prev => prev.map((c, i) => i === index ? choice : c))

    return {
        send, sendWithContext, regenerate,
        isSending, isRegenerating, pendingUserText, pendingReplyForId, streamingText,
        configs, addConfig, removeConfig, updateConfig,
        viewMode, setViewMode,
    }
}