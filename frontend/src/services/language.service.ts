import api from './api'
import type { components } from '../types/api'

type Language = components['schemas']['LanguageLearningResponse']

export async function fetchLanguages(): Promise<Language[]> {
  const response = await api.get('/languages')
  return response.data
}