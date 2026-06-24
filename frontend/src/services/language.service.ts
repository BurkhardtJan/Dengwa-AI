import api from './api'
import type {components} from '../types/api'

type Language = components['schemas']['LanguageLearningResponse']
type LanguageCreate = components['schemas']['LanguageLearningCreate']
type LanguageUpdate = components['schemas']['LanguageLearningUpdate']

export async function fetchLanguages(): Promise<Language[]> {
    const response = await api.get('/languages')
    return response.data
}

export async function createLanguage(data: LanguageCreate): Promise<Language> {
    const response = await api.post(`/languages/`, data)
    return response.data
}

export async function fetchLanguage(lan: string): Promise<Language> {
    const response = await api.get(`/languages/${lan}`)
    return response.data
}

export async function updateLanguage(lan: string, data: LanguageUpdate): Promise<Language> {
    const response = await api.put(`/languages/${lan}`, data)
    return response.data
}

export async function deleteLanguage(lan: string): Promise<void> {
    await api.delete(`/languages/${lan}`)
}