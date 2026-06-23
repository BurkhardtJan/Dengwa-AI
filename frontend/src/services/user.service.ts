import api from './api'

export async function fetchMe() {
  const response = await api.get('/users/me')
  return response.data
}