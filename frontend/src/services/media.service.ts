import api from './api'
import type {components} from '../types/api'

type Media = components['schemas']['MediaResponse']

export async function fetchMedia(lan?: string): Promise<Media[]> {
    const response = await api.get('/media', {params: lan ? {lan} : {}})
    return response.data
}

export async function fetchMedium(mediaId: string): Promise<Media> {
    const response = await api.get(`/media/${mediaId}`)
    return response.data
}

export async function uploadMedia(lan: string, title: string, file: File): Promise<Media> {
    const formData = new FormData()
    formData.append('title', title)
    formData.append('file', file)
    const response = await api.post('/media', formData, {
        params: {lan},
        headers: {'Content-Type': 'multipart/form-data'}
    })
    return response.data
}

export async function extractVocabulary(mediaId: string): Promise<void> {
    await api.post(`/media/${mediaId}/vocabulary`)
}

export async function deleteMedia(mediaId: string): Promise<void> {
    await api.delete(`/media/${mediaId}`)
}