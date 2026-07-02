import {useState, useEffect, useMemo} from 'react'
import {useMutation, useQueryClient, useQuery} from '@tanstack/react-query'
import {fetchChatHistory, sendMessage, createResponse} from '@/services/chat.service.ts'
import {getActivePath, getSiblings, findDeepestLeaf, findGlobalLatestLeaf} from '@/utils/tree.utils'

export interface ModelChoice {
    provider: string | null
    model: string | null
    embeddingModel: string | null
}

const EMPTY_CHOICE: ModelChoice = {provider: null, model: null, embeddingModel: null}

export function useChatTree(chatId: string | undefined) {
    const queryClient = useQueryClient()
    const [activeLeafId, setActiveLeafId] = useState<string | null>(null)
    const [modelChoice, setModelChoice] = useState<ModelChoice>(EMPTY_CHOICE)

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
        mutationFn: ({message, parentId}: { message: string; parentId: string | null }) =>
            sendMessage(
                chatId!,
                message,
                parentId,
                modelChoice.provider,
                modelChoice.model,
                modelChoice.embeddingModel
            ),
        onSuccess: (newMessages) => {
            queryClient.invalidateQueries({queryKey: ['chatHistory', chatId]})
            const newLeaf = newMessages[newMessages.length - 1]
            if (newLeaf) setActiveLeafId(newLeaf.id)
        }
    })

    const regenerateMutation = useMutation({
        mutationFn: (userMessageId: string) =>
            createResponse(
                chatId!, userMessageId,
                modelChoice.provider, modelChoice.model, modelChoice.embeddingModel
            ),
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

    return {
        history,
        activePath,
        isLoading,
        isError,
        isSending: sendMessageMutation.isPending,
        isRegenerating: regenerateMutation.isPending,
        switchSibling,
        getSiblingInfo,
        sendNew,
        sendEdit,
        regenerate,
        modelChoice,
        setModelChoice
    }
}