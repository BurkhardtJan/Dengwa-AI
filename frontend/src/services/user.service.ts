import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

export async function fetchMe() {
  const token = localStorage.getItem('token')
  const response = await axios.get(`${BASE_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  return response.data
}