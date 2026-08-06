import {useEffect, useRef, useState} from 'react'
import {useQueryClient} from '@tanstack/react-query'
import {streamMessage, streamResponse, writeMessage} from '@/services/chat.service.ts'
import {useSpeechSettings} from '@/context/SpeechSettingsContext'
import {getTtsEngine} from '@/lib/speech/registry'
import {createStreamingSpeaker} from '@/lib/speech/streamingSpeaker'
import {toBcp47} from '@/lib/speech/languageCodes'
import type {components} from '@/types/api'

type Chat = components['schemas']['ChatResponse']

export interface ModelChoice {
    provider: string | null
    model: string | null
    embeddingModel: string | null
    /** undefined -> backend default (1.0) */
    temperature?: number
    /** null/undefined -> no limit set */
    maxTokens?: number | null
}

export type ViewMode = 'switch' | 'sbs'

const EMPTY_CHOICE: ModelChoice = {
    provider: null, model: null, embeddingModel: null, temperature: undefined, maxTokens: null
}
const VIEW_MODE_KEY = 'dengwa-chat-view-mode'
const SHOW_METADATA_KEY = 'dengwa-chat-show-metadata'

export function useChatMessaging(chatId: string | undefined, onNewLeaf: (id: string) => void, learningLanguage: string) {
    const queryClient = useQueryClient()
    const {ttsEngine, speakWhileStreaming} = useSpeechSettings()
    const [configs, setConfigs] = useState<ModelChoice[]>([EMPTY_CHOICE])
    const [pendingUserText, setPendingUserText] = useState<string | null>(null)
    const [pendingReplyForId, setPendingReplyForId] = useState<string | null>(null)
    const [streamingText, setStreamingText] = useState<string | null>(null)
    // Per-slot streaming text while a compare send (2+ configs) is in flight.
    // Index 0 = primary, same order as `configs`. Null outside a compare send.
    const [compareStreamingTexts, setCompareStreamingTexts] = useState<(string | null)[] | null>(null)
    const [isSending, setIsSending] = useState(false)
    const [isRegenerating, setIsRegenerating] = useState(false)
    // Tracks the currently-playing/-queued streaming speaker so a new
    // message can cut off leftover audio from a previous one, instead of
    // both playing on top of each other.
    const activeSpeakerRef = useRef<ReturnType<typeof createStreamingSpeaker> | null>(null)
    const [isSpeakingStream, setIsSpeakingStream] = useState(false)

    // Stop any queued/playing speech if the chat unmounts mid-stream
    // (navigating away) - otherwise it just keeps talking in the background.
    useEffect(() => () => activeSpeakerRef.current?.stop(), [])

    const [viewMode, setViewModeState] = useState<ViewMode>(() => {
        const stored = localStorage.getItem(VIEW_MODE_KEY)
        return stored === 'sbs' ? 'sbs' : 'switch'
    })
    const setViewMode = (mode: ViewMode) => {
        setViewModeState(mode)
        localStorage.setItem(VIEW_MODE_KEY, mode)
    }

    // MVP-only debug toggle - shows token counts + estimated cost under each
    // AI reply. Off by default; end users won't care, but it's handy while
    // comparing models. Persisted the same way as viewMode.
    const [showMetadata, setShowMetadataState] = useState<boolean>(() => localStorage.getItem(SHOW_METADATA_KEY) === 'true')
    const setShowMetadata = (value: boolean) => {
        setShowMetadataState(value)
        localStorage.setItem(SHOW_METADATA_KEY, String(value))
    }

    function startStreamingSpeaker() {
        activeSpeakerRef.current?.stop() // cut off anything left over from a previous message
        if (!speakWhileStreaming || !learningLanguage) return null
        const engine = getTtsEngine(ttsEngine)
        if (!engine.isSupported()) return null
        const speaker = createStreamingSpeaker(engine, toBcp47(learningLanguage), setIsSpeakingStream)
        activeSpeakerRef.current = speaker
        return speaker
    }

    function stopSpeaking() {
        activeSpeakerRef.current?.stop()
    }

    async function send(message: string, parentId: string | null) {
        const activeConfigs = configs.length > 0 ? configs : [EMPTY_CHOICE]
        const [primary, ...extra] = activeConfigs
        const isCompare = extra.length > 0
        const speaker = startStreamingSpeaker() // only the primary reply is read aloud

        setIsSending(true)
        setPendingUserText(message)
        setStreamingText('')
        setCompareStreamingTexts(isCompare ? activeConfigs.map(() => '') : null)

        // Extras need the persisted user-message id before they can start
        // their own /messages/{id}/stream call - the primary stream creates
        // that message and emits it as its first SSE event. This resolves
        // as soon as that event arrives, so extras start almost immediately
        // alongside the primary instead of waiting for it to finish.
        let resolveUserMessageId: (id: string) => void = () => {
        }
        const userMessageIdPromise = new Promise<string>(resolve => {
            resolveUserMessageId = resolve
        })

        async function runPrimary() {
            for await (const event of streamMessage(
                chatId!, message, parentId,
                primary.provider, primary.model, primary.embeddingModel, primary.temperature, primary.maxTokens
            )) {
                if (event.type === 'user_message') {
                    resolveUserMessageId(event.message.id)
                } else if (event.type === 'chunk') {
                    setStreamingText(prev => (prev ?? '') + event.content)
                    setCompareStreamingTexts(prev => {
                        if (!prev) return prev
                        const next = [...prev]
                        next[0] = (next[0] ?? '') + event.content
                        return next
                    })
                    speaker?.push(event.content)
                } else if (event.type === 'done') {
                    onNewLeaf(event.message.id)
                } else if (event.type === 'title') {
                    queryClient.setQueryData(['chatMeta', chatId], (old: Chat | undefined) =>
                        old ? {...old, title: event.title} : old
                    )
                    void queryClient.invalidateQueries({queryKey: ['chat']})
                }
            }
            speaker?.flush() // speaks whatever's left without trailing punctuation - keeps playing in the background after this function returns
        }

        // Extra compare slots stream too now, so the user sees all columns
        // filling in side by side instead of the extras just popping in
        // once done. They become additional siblings the user can switch
        // to/compare - only the primary's reply becomes the new active leaf.
        async function runExtra(cfg: ModelChoice, slotIndex: number) {
            const userMessageId = await userMessageIdPromise
            for await (const event of streamResponse(
                chatId!, userMessageId, cfg.provider, cfg.model, cfg.embeddingModel, cfg.temperature, cfg.maxTokens
            )) {
                if (event.type === 'chunk') {
                    setCompareStreamingTexts(prev => {
                        if (!prev) return prev
                        const next = [...prev]
                        next[slotIndex] = (next[slotIndex] ?? '') + event.content
                        return next
                    })
                }
            }
        }

        try {
            await Promise.all([runPrimary(), ...extra.map((cfg, i) => runExtra(cfg, i + 1))])
        } finally {
            await queryClient.invalidateQueries({queryKey: ['chatHistory', chatId]})
            setIsSending(false)
            setPendingUserText(null)
            setStreamingText(null)
            setCompareStreamingTexts(null)
        }
    }

    async function sendWithContext(message: string, context: string, parentId: string | null) {
        const contextNode = await writeMessage(chatId!, context, 'context', parentId)
        await send(message, contextNode.id)
    }

    async function regenerate(userMessageId: string) {
        const primary = configs[0] ?? EMPTY_CHOICE
        const speaker = startStreamingSpeaker()

        setIsRegenerating(true)
        setPendingReplyForId(userMessageId)
        setStreamingText('')

        try {
            for await (const event of streamResponse(
                chatId!, userMessageId,
                primary.provider, primary.model, primary.embeddingModel, primary.temperature, primary.maxTokens
            )) {
                if (event.type === 'chunk') {
                    setStreamingText(prev => (prev ?? '') + event.content)
                    speaker?.push(event.content)
                } else if (event.type === 'done') {
                    onNewLeaf(event.message.id)
                }
            }
            speaker?.flush()
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
        isSending, isRegenerating, pendingUserText, pendingReplyForId, streamingText, compareStreamingTexts,
        configs, addConfig, removeConfig, updateConfig,
        viewMode, setViewMode,
        showMetadata, setShowMetadata,
        isSpeakingStream, stopSpeaking,
    }
}