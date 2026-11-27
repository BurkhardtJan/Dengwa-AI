import api from './api'
import type {components} from '../types/api'

type Media = components['schemas']['MediaResponse']
type Subtitle = components['schemas']['SubtitleResponse']

export async function fetchMedia(lan?: string): Promise<Media[]> {
    const response = await api.get('/media', {params: lan ? {lan} : {}})
    return response.data
}

export async function fetchMedium(mediaId: string): Promise<Media> {
    const response = await api.get(`/media/${mediaId}`)
    return response.data
}

export async function fetchMediaBlob(mediaId: string): Promise<Blob> {
    const response = await api.get(`/media/${mediaId}/file`, {
        responseType: 'blob'
    })
    return response.data
}

export async function uploadMedia(lan: string, file: File, title?: string): Promise<Media> {
    const formData = new FormData()
    if (title && title.trim()) {
        formData.append('title', title)
    }
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

export async function fetchSubtitles(mediaId: string): Promise<Subtitle[]> {
    const response = await api.get(`/media/${mediaId}/subtitles`)
    return response.data
}

export async function fetchSubtitleBlob(mediaId: string, language: string): Promise<Blob> {
    const response = await api.get(`/media/${mediaId}/subtitles/${language}/file`, {
        responseType: 'blob'
    })
    return response.data
}

/** Adds the subtitle track of a language; an existing track of that language is replaced. */
export async function uploadSubtitle(mediaId: string, file: File, language: string): Promise<Subtitle> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('language', language)
    const response = await api.post(`/media/${mediaId}/subtitles`, formData, {
        headers: {'Content-Type': 'multipart/form-data'}
    })
    return response.data
}

export async function deleteSubtitle(mediaId: string, language: string): Promise<void> {
    await api.delete(`/media/${mediaId}/subtitles/${language}`)
}
