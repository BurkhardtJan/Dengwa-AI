import {useState, useEffect, useMemo} from 'react'
import {useMutation, useQueryClient, useQuery} from '@tanstack/react-query'
import {fetchChatHistory, sendMessage, createResponse} from '@/services/chat.service.ts'
import {getActivePath, getSiblings, findDeepestLeaf, findGlobalLatestLeaf} from '@/utils/tree.utils'

export interface ModelChoice {
    provider: string | null
    model: string | null
    embeddingModel: string | null
}

export type ViewMode = 'switch' | 'sbs'

const EMPTY_CHOICE: ModelChoice = {provider: null, model: null, embeddingModel: null}
const VIEW_MODE_KEY = 'dengwa-chat-view-mode'

export function useChatTree(chatId: string | undefined) {
    const queryClient = useQueryClient()
    const [activeLeafId, setActiveLeafId] = useState<string | null>(null)

    const [configs, setConfigs] = useState<ModelChoice[]>([EMPTY_CHOICE])

    const [viewMode, setViewModeState] = useState<ViewMode>(() => {
        const stored = localStorage.getItem(VIEW_MODE_KEY)
        return stored === 'sbs' ? 'sbs' : 'switch'
    })

    const setViewMode = (mode: ViewMode) => {
        setViewModeState(mode)
        localStorage.setItem(VIEW_MODE_KEY, mode)
    }

    const {data: history, isLoading, isError} = useQuery({
        queryKey: ['chatHistory', chatId],
        queryFn: () => fetchChatHistory(chatId!),
        enabled: !!chatId
    })

    useEffect(() => {
        if (history && history.length > 0 && activeLeafId === null) {
            setActiveLeafId(findGlobalLatestLeaf(history))
        }
    }, [history, activeLeafId])

    const activePath = useMemo(
        () => getActivePath(history ?? [], activeLeafId),
        [history, activeLeafId]
    )

    const sendMessageMutation = useMutation({
        mutationFn: async ({message, parentId}: { message: string; parentId: string | null }) => {
            const [primary, ...extra] = configs.length > 0 ? configs : [EMPTY_CHOICE]

            const primaryResult = await sendMessage(
                chatId!, message, parentId,
                primary.provider, primary.model, primary.embeddingModel
            )
            const userMessage = primaryResult[0]

            const extraResults = extra.length > 0
                ? await Promise.all(
                    extra.map(cfg =>
                        createResponse(chatId!, userMessage.id, cfg.provider, cfg.model, cfg.embeddingModel)
                    )
                )
                : []

            return {primaryResult, extraResults: extraResults.flat()}
        },
        onSuccess: ({primaryResult}) => {
            queryClient.invalidateQueries({queryKey: ['chatHistory', chatId]})
            const primaryLeaf = primaryResult[primaryResult.length - 1]
            if (primaryLeaf) setActiveLeafId(primaryLeaf.id)
        }
    })

    const regenerateMutation = useMutation({
        mutationFn: (userMessageId: string) => {
            const primary = configs[0] ?? EMPTY_CHOICE
            return createResponse(
                chatId!, userMessageId,
                primary.provider, primary.model, primary.embeddingModel
            )
        },
        onSuccess: (newMessages) => {
            queryClient.invalidateQueries({queryKey: ['chatHistory', chatId]})
            const newLeaf = newMessages[newMessages.length - 1]
            if (newLeaf) setActiveLeafId(newLeaf.id)
        }
    })

    const switchSibling = (messageId: string, direction: 'prev' | 'next') => {
        if (!history) return
        const siblings = getSiblings(history, messageId)
        const idx = siblings.findIndex(s => s.id === messageId)
        const targetIdx = direction === 'next' ? idx + 1 : idx - 1
        const target = siblings[targetIdx]
        if (!target) return
        setActiveLeafId(findDeepestLeaf(history, target.id))
    }

    const getSiblingInfo = (messageId: string) => {
        if (!history) return {index: 0, count: 1}
        const siblings = getSiblings(history, messageId)
        return {index: siblings.findIndex(s => s.id === messageId), count: siblings.length}
    }

    const getSiblingMessages = (messageId: string) => {
        if (!history) return []
        return getSiblings(history, messageId)
    }

    const sendNew = (message: string) => {
        const parentId = activePath.length > 0 ? activePath[activePath.length - 1].id : null
        sendMessageMutation.mutate({message, parentId})
    }

    const sendEdit = (message: string, originalParentId: string | null | undefined) => {
        sendMessageMutation.mutate({message, parentId: originalParentId ?? null})
    }

    const regenerate = (userMessageId: string) => {
        regenerateMutation.mutate(userMessageId)
    }

    const addConfig = () => setConfigs(prev => [...prev, EMPTY_CHOICE])
    const removeConfig = (index: number) => setConfigs(prev => prev.filter((_, i) => i !== index))
    const updateConfig = (index: number, choice: ModelChoice) =>
        setConfigs(prev => prev.map((c, i) => i === index ? choice : c))

    return {
        history,
        activePath,
        isLoading,
        isError,
        isSending: sendMessageMutation.isPending,
        isRegenerating: regenerateMutation.isPending,
        switchSibling,
        getSiblingInfo,
        getSiblingMessages,
        sendNew,
        sendEdit,
        regenerate,
        configs,
        addConfig,
        removeConfig,
        updateConfig,
        viewMode,
        setViewMode
    }
}