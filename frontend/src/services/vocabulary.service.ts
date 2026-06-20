import axios from 'axios'
import type { components } from '../types/api'

type Vocabulary = components['schemas']['VocabularyResponse']
type VocabularyCreate = components['schemas']['VocabularyCreate']
type VocabularyUpdate = components['schemas']['VocabularyUpdate']

const BASE_URL = 'http://localhost:8000'

function authHeader() {
  const token = localStorage.getItem('token')
  return { Authorization: `Bearer ${token}` }
}

export async function fetchVocabularies(lan?: string): Promise<Vocabulary[]> {
  const response = await axios.get(`${BASE_URL}/vocabularies`, {
    headers: authHeader(),
    params: lan ? { lan } : {}
  })
  return response.data
}

export async function createVocabulary(lan: string, data: VocabularyCreate): Promise<Vocabulary> {
  const response = await axios.post(`${BASE_URL}/vocabularies`, data, {
    headers: authHeader(),
    params: { lan }
  })
  return response.data
}

export async function updateVocabulary(id: string, data: VocabularyUpdate): Promise<Vocabulary> {
  const response = await axios.put(`${BASE_URL}/vocabularies/${id}`, data, {
    headers: authHeader()
  })
  return response.data
}

export async function deleteVocabulary(id: string): Promise<void> {
  await axios.delete(`${BASE_URL}/vocabularies/${id}`, {
    headers: authHeader()
  })
}