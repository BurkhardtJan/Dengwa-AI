export interface ChatMessage {
    id: string
    role: string
    message: string
    timestamp: string
    parent_id?: string | null
    provider?: string | null
    model?: string | null
    embedding_model?: string | null
    temperature?: number | null
    max_tokens?: number | null
    input_tokens?: number | null
    output_tokens?: number | null
    /** Rough cost estimate in USD, null if provider/model has no price entry. */
    estimated_cost_usd: number | null
}

export interface Chat {
    id: string
    media_id: string
    learning_id: string
    user_id: string
    title?: string | null
    media_title: string
    learning_language: string
}

export type StreamEvent =
    | { type: 'user_message'; message: ChatMessage }
    | { type: 'chunk'; content: string }
    | { type: 'done'; message: ChatMessage }
    | { type: 'title'; title: string }

export interface ChatAdapter {
    fetchChats(learningLanguage?: string): Promise<Chat[]>

    createChat(mediaId: string, title?: string): Promise<Chat>

    fetchChatHistory(chatId: string): Promise<ChatMessage[]>

    sendMessage(chatId: string, message: string, parentId?: string | null, provider?: string | null, model?: string | null, embeddingModel?: string | null, temperature?: number | null, maxTokens?: number | null): Promise<ChatMessage[]>

    createResponse(chatId: string, userMessageId: string, provider?: string | null, model?: string | null, embeddingModel?: string | null, temperature?: number | null, maxTokens?: number | null): Promise<ChatMessage[]>

    deleteChat(chatId: string): Promise<void>

    streamMessage(chatId: string, message: string, parentId: string | null, provider?: string | null, model?: string | null, embeddingModel?: string | null, temperature?: number | null, maxTokens?: number | null): AsyncGenerator<StreamEvent>

    streamResponse(chatId: string, userMessageId: string, provider?: string | null, model?: string | null, embeddingModel?: string | null, temperature?: number | null, maxTokens?: number | null): AsyncGenerator<StreamEvent>

    writeMessage(chatId: string, message: string, role: string, parentId?: string | null): Promise<ChatMessage>

    updateChatTitle(chatId: string, title: string): Promise<Chat>
}