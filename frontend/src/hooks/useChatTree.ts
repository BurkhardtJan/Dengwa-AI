import {useMemo} from 'react'
import {useQuery} from '@tanstack/react-query'
import {fetchChatHistory} from '@/services/chat.service.ts'
import {useChatBranches} from './useChatBranches'
import {useChatMessaging} from './useChatMessaging'
import {PENDING_USER_MESSAGE_ID} from '@/utils/tree.utils'
import type {components} from '@/types/api'

export type {ModelChoice, ViewMode} from './useChatMessaging'

type ChatMessage = components['schemas']['ChatMessageResponse']

export function useChatTree(chatId: string | undefined, learningLanguage: string) {
    const {data: history, isLoading, isError, error} = useQuery({
        queryKey: ['chatHistory', chatId],
        queryFn: () => fetchChatHistory(chatId!),
        enabled: !!chatId
    })

    const branches = useChatBranches(history)
    const messaging = useChatMessaging(chatId, branches.setActiveLeafId, learningLanguage)

    const displayPath = useMemo<ChatMessage[]>(() => {
        if (!messaging.pendingUserText) return branches.activePath

        const tempUser: ChatMessage = {
            id: PENDING_USER_MESSAGE_ID,
            role: 'user',
            message: messaging.pendingUserText,
            timestamp: new Date().toISOString(),
            parent_id: branches.activePath.length > 0
                ? branches.activePath[branches.activePath.length - 1].id
                : null,
            provider: null,
            model: null,
            embedding_model: null,
        }
        return [...branches.activePath, tempUser]
    }, [branches.activePath, messaging.pendingUserText])

    const sendNew = (message: string) => {
        const parentId = branches.activePath.length > 0
            ? branches.activePath[branches.activePath.length - 1].id
            : null
        messaging.send(message, parentId)
    }

    const sendNewWithContext = (message: string, context: string) => {
        const parentId = branches.activePath.length > 0
            ? branches.activePath[branches.activePath.length - 1].id
            : null
        messaging.sendWithContext(message, context, parentId)
    }

    const sendEdit = (message: string, originalParentId: string | null | undefined) => {
        messaging.send(message, originalParentId ?? null)
    }

    return {
        history,
        activePath: branches.activePath,
        displayPath,
        isLoading,
        isError,
        error,
        isSending: messaging.isSending,
        isRegenerating: messaging.isRegenerating,
        pendingReplyForId: messaging.pendingReplyForId,
        streamingText: messaging.streamingText,
        switchSibling: branches.switchSibling,
        getSiblingInfo: branches.getSiblingInfo,
        getSiblingMessages: branches.getSiblingMessages,
        selectBranch: branches.selectBranch,
        sendNew,
        sendNewWithContext,
        sendEdit,
        regenerate: messaging.regenerate,
        configs: messaging.configs,
        addConfig: messaging.addConfig,
        removeConfig: messaging.removeConfig,
        updateConfig: messaging.updateConfig,
        viewMode: messaging.viewMode,
        setViewMode: messaging.setViewMode,
    }
}