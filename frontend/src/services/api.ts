import axios from 'axios'
import {authStorage} from '@/lib/authStorage'

const api = axios.create({
    baseURL: 'http://localhost:8000',
})

api.interceptors.request.use((config) => {
    const token = authStorage.getToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            authStorage.clearToken()
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api