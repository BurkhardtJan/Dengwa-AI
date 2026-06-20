import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

export async function login(username: string, password: string) {
  const formData = new URLSearchParams()
  formData.append('username', username)
  formData.append('password', password)

  const response = await axios.post(`${BASE_URL}/users/login`, formData)
  return response.data  // { access_token, token_type }
}