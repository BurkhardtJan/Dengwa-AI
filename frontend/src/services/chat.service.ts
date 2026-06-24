import api from './api'
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

export async function sendMessage(chatId: string, message: string): Promise<ChatMessage[]> {
    const response = await api.post(`/chats/${chatId}`, {message})
    return response.data
}

export async function deleteChat(chatId: string): Promise<void> {
    await api.delete(`/chats/${chatId}`)
}