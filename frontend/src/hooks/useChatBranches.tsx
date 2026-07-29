import {useState, useEffect, useMemo} from 'react'
import {getActivePath, getSiblings, findDeepestLeaf, findGlobalLatestLeaf} from '@/utils/tree.utils'
import type {components} from '@/types/api'

type ChatMessage = components['schemas']['ChatMessageResponse']

export function useChatBranches(history: ChatMessage[] | undefined) {
    const [activeLeafId, setActiveLeafId] = useState<string | null>(null)

    useEffect(() => {
        if (history && history.length > 0 && activeLeafId === null) {
            setActiveLeafId(findGlobalLatestLeaf(history))
        }
    }, [history, activeLeafId])

    const activePath = useMemo(
        () => getActivePath(history ?? [], activeLeafId),
        [history, activeLeafId]
    )

    const switchSibling = (messageId: string, direction: 'prev' | 'next') => {
        if (!history) return
        const siblings = getSiblings(history, messageId)
        const idx = siblings.findIndex(s => s.id === messageId)
        const target = siblings[direction === 'next' ? idx + 1 : idx - 1]
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

    const selectBranch = (messageId: string) => {
        if (!history) return
        setActiveLeafId(findDeepestLeaf(history, messageId))
    }

    return {activeLeafId, setActiveLeafId, activePath, switchSibling, getSiblingInfo, getSiblingMessages, selectBranch}
}