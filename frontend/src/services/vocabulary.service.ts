import api from './api'
import type {components} from '../types/api'

type Vocabulary = components['schemas']['VocabularyResponse']
type VocabularyCreate = components['schemas']['VocabularyCreate']
type VocabularyUpdate = components['schemas']['VocabularyUpdate']

export async function fetchVocabularies(lan?: string, mediaId?: string): Promise<Vocabulary[]> {
    const response = await api.get('/vocabularies', {
        params: {...(lan ? {lan} : {}), ...(mediaId ? {media_id: mediaId} : {})},
    })
    return response.data
}

export async function createVocabulary(lan: string, data: VocabularyCreate): Promise<Vocabulary> {
    const response = await api.post('/vocabularies', data, {params: {lan}})
    return response.data
}

export async function fetchVocabulary(id: string): Promise<Vocabulary> {
    const response = await api.get(`/vocabularies/${id}`)
    return response.data
}

export async function updateVocabulary(id: string, data: VocabularyUpdate): Promise<Vocabulary> {
    const response = await api.put(`/vocabularies/${id}`, data)
    return response.data
}

export async function deleteVocabulary(id: string): Promise<void> {
    await api.delete(`/vocabularies/${id}`)
}