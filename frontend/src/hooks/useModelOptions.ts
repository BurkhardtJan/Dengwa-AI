import {useQuery} from '@tanstack/react-query'
import {fetchChatProviders, fetchEmbeddingProviders} from '@/services/model.service.ts'

const STALE_TIME = 600000

export function useChatProviders() {
    return useQuery({
        queryKey: ['chatProviders'],
        queryFn: fetchChatProviders,
        staleTime: STALE_TIME
    })
}

export function useEmbeddingProviders() {
    return useQuery({
        queryKey: ['embeddingProviders'],
        queryFn: fetchEmbeddingProviders,
        staleTime: STALE_TIME
    })
}