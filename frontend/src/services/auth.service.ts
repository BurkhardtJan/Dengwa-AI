import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

export async function login(username: string, password: string) {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)

    const response = await axios.post(`${BASE_URL}/users/login`, formData)
    return response.data  // { access_token, token_type }
}

export async function register(username: string, password: string, native_language: string = 'de') {
    const response = await axios.post(`${BASE_URL}/users/register`, {
        username,
        password,
        native_language,
    })
    return response.data
}