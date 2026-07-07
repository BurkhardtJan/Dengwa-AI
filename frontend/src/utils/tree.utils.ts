import type {components} from '../types/api'

type ChatMessage = components['schemas']['ChatMessageResponse']

export const PENDING_USER_MESSAGE_ID = '__pending_user__'

export function getActivePath(history: ChatMessage[], activeId: string | null | undefined): ChatMessage[] {
    if (!activeId) return []

    const path: ChatMessage[] = []
    let currentId: string | null | undefined = activeId
    let guard = 0

    while (currentId && guard < 200) {
        const lookupId: string = currentId
        const found = history.find((m: ChatMessage) => m.id === lookupId)
        if (!found) break

        path.push(found)
        currentId = found.parent_id
        guard++
    }
    return path.reverse()
}


export function getSiblings(history: ChatMessage[], messageId: string): ChatMessage[] {
    const current = history.find(m => m.id === messageId)
    if (!current) return []

    // Alle Nachrichten finden, die die gleiche parent_id haben
    return history.filter(m => m.parent_id === current.parent_id)
}


export function findDeepestLeaf(history: ChatMessage[], startId: string): string {
    let currentId = startId

    while (true) {
        const children = history.filter(m => m.parent_id === currentId)
        if (children.length === 0) break

        const latestChild = children.reduce((latest, child) => {
            return new Date(child.timestamp) > new Date(latest.timestamp) ? child : latest
        }, children[0])

        currentId = latestChild.id
    }

    return currentId
}

export function findGlobalLatestLeaf(history: ChatMessage[]): string | null {
    if (history.length === 0) return null

    const latest = history.reduce((a, b) =>
        new Date(a.timestamp) > new Date(b.timestamp) ? a : b
    )
    return latest.id
}