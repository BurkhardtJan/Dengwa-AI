import api from './api'
import type {components} from '../types/api'

type ReviewCard = components['schemas']['ReviewCardOut']


export interface ReviewQueueCounts {
    new: number
    learning: number
    review: number
    total: number
}

export interface ReviewStats {
    total_cards: number
    mature: number
    young: number
    new: number
    retention_rate_7d: number | null
}

export interface ReviewTimelineEntry {
    date: string
    reviews: number
    successful: number
    again: number
    retention_rate: number
}

// 1=again, 2=hard, 3=good, 4=easy — matches backend SM-2 mapping
export type ReviewEase = 1 | 2 | 3 | 4

interface ReviewScopeParams {
    learning_id?: string
    media_id?: string
    template?: string
}

export async function fetchNextReviewCard(params: ReviewScopeParams = {}): Promise<ReviewCard | null> {
    const response = await api.get('/reviews/next', {params})
    return response.data
}

export async function submitReview(cardId: string, ease: ReviewEase): Promise<ReviewCard> {
    const response = await api.post(`/reviews/${cardId}`, {ease})
    return response.data
}

export async function fetchReviewCounts(params: ReviewScopeParams = {}): Promise<ReviewQueueCounts> {
    const response = await api.get('/reviews/count', {params})
    return response.data
}

export async function fetchReviewStats(params: ReviewScopeParams = {}): Promise<ReviewStats> {
    const response = await api.get('/reviews/stats', {params})
    return response.data
}

export async function fetchReviewTimeline(
    params: ReviewScopeParams & { days?: number } = {}
): Promise<ReviewTimelineEntry[]> {
    const response = await api.get('/reviews/timeline', {params})
    return response.data
}