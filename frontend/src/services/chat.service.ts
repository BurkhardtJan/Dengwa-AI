import api, {API_BASE_URL} from './api'
import {authStorage} from '@/lib/authStorage'
import type {components} from '../types/api'

type Chat = components['schemas']['ChatResponse']
type ChatMessage = components['schemas']['ChatMessageResponse']

export async function fetchChats(lan?: string): Promise<Chat[]> {
    const response = await api.get('/chats', {params: lan ? {lan} : {}})
    return response.data
}

export async function createChat(mediaId: string): Promise<Chat> {
    const response = await api.post('/chats', null, {params: {media_id: mediaId}})
    return response.data
}

export async function fetchChatHistory(chatId: string): Promise<ChatMessage[]> {
    const response = await api.get(`/chats/${chatId}`)
    return response.data
}

export async function sendMessage(
    chatId: string,
    message: string,
    parentId?: string | null,
    provider?: string | null,
    model?: string | null,
    embeddingModel?: string | null
): Promise<ChatMessage[]> {
    const response = await api.post(`/chats/${chatId}`, {message, parent_id: parentId ?? null}, {
        params: {
            provider: provider ?? undefined,
            model: model ?? undefined,
            embedding_model: embeddingModel ?? undefined
        }
    })
    return response.data
}

export async function createResponse(
    chatId: string,
    userMessageId: string,
    provider?: string | null,
    model?: string | null,
    embeddingModel?: string | null
): Promise<ChatMessage[]> {
    const response = await api.post(`/chats/${chatId}/messages/${userMessageId}`, null, {
        params: {
            provider: provider ?? undefined,
            model: model ?? undefined,
            embedding_model: embeddingModel ?? undefined
        }
    })
    return response.data
}

export async function deleteChat(chatId: string): Promise<void> {
    await api.delete(`/chats/${chatId}`)
}

export type StreamEvent =
    | { type: 'user_message'; message: ChatMessage }
    | { type: 'chunk'; content: string }
    | { type: 'done'; message: ChatMessage }

async function* readSSE(response: Response): AsyncGenerator<StreamEvent> {
    if (!response.body) throw new Error('No response body')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
        const {done, value} = await reader.read()
        if (done) break
        buffer += decoder.decode(value, {stream: true})

        const frames = buffer.split('\n\n')
        buffer = frames.pop() ?? ''   // last (possibly incomplete) frame stays buffered

        for (const frame of frames) {
            const line = frame.replace(/^data: /, '')
            if (line) yield JSON.parse(line) as StreamEvent
        }
    }
}

export async function* streamMessage(
    chatId: string,
    message: string,
    parentId: string | null,
    provider?: string | null,
    model?: string | null,
    embeddingModel?: string | null,
): AsyncGenerator<StreamEvent> {
    const params = new URLSearchParams()
    if (provider) params.set('provider', provider)
    if (model) params.set('model', model)
    if (embeddingModel) params.set('embedding_model', embeddingModel)

    const response = await fetch(`${API_BASE_URL}/chats/${chatId}/stream?${params}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authStorage.getToken()}`,
        },
        body: JSON.stringify({message, parent_id: parentId}),
    })

    yield* readSSE(response)
}

export async function* streamResponse(
    chatId: string,
    userMessageId: string,
    provider?: string | null,
    model?: string | null,
    embeddingModel?: string | null,
): AsyncGenerator<StreamEvent> {
    const params = new URLSearchParams()
    if (provider) params.set('provider', provider)
    if (model) params.set('model', model)
    if (embeddingModel) params.set('embedding_model', embeddingModel)

    const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages/${userMessageId}/stream?${params}`, {
        method: 'POST',
        headers: {Authorization: `Bearer ${authStorage.getToken()}`},
    })

    yield* readSSE(response)
}