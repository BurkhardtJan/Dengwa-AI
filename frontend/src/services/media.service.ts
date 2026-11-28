import {isAxiosError} from 'axios'
import api from './api'
import type {components} from '../types/api'

type Media = components['schemas']['MediaResponse']
type Subtitle = components['schemas']['SubtitleResponse']
type Ocr = components['schemas']['OcrResponse']

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

/** Starts creating summary, topics, genre and difficulty again; provider/model are optional. */
export async function generateMetadata(mediaId: string, provider: string | null, model: string | null): Promise<void> {
    await api.post(`/media/${mediaId}/metadata`, null, {
        params: {provider: provider ?? undefined, model: model ?? undefined}
    })
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

/** Info about the recognized text (hOCR) of a medium, or null if it has none. */
export async function fetchOcrInfo(mediaId: string): Promise<Ocr | null> {
    try {
        const response = await api.get(`/media/${mediaId}/ocr`)
        return response.data
    } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) return null
        throw error
    }
}

export async function fetchOcrBlob(mediaId: string): Promise<Blob> {
    const response = await api.get(`/media/${mediaId}/ocr/file`, {
        responseType: 'blob'
    })
    return response.data
}

/** Sets the hOCR file of a comic or image; an existing one is replaced. */
export async function uploadOcr(mediaId: string, file: File): Promise<Ocr> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.put(`/media/${mediaId}/ocr`, formData, {
        headers: {'Content-Type': 'multipart/form-data'}
    })
    return response.data
}

export async function deleteOcr(mediaId: string): Promise<void> {
    await api.delete(`/media/${mediaId}/ocr`)
}
