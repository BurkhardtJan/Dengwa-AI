import axios from 'axios'
import type { components } from '../types/api'

type Language = components['schemas']['LanguageLearningResponse']

const BASE_URL = 'http://localhost:8000'

function authHeader() {
  const token = localStorage.getItem('token')
  return { Authorization: `Bearer ${token}` }
}

export async function fetchLanguages(): Promise<Language[]> {
  const response = await axios.get(`${BASE_URL}/languages`, {
    headers: authHeader()
  })
  return response.data
}