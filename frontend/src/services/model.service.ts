import api from './api'
import type {components} from '../types/api'

type ProviderModelsResponse = components['schemas']['ProviderModelsResponse']
type EmbeddingModelsResponse = components['schemas']['EmbeddingModelsResponse']

export async function fetchChatProviders(): Promise<ProviderModelsResponse> {
    const response = await api.get('/llm_models/chat')
    return response.data
}

export async function fetchEmbeddingProviders(): Promise<EmbeddingModelsResponse> {
    const response = await api.get('/llm_models/embedding')
    return response.data
}