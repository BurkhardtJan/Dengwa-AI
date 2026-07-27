const TOKEN_KEY = 'token'

export const authStorage = {
    getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
    setToken: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
    clearToken: (): void => localStorage.removeItem(TOKEN_KEY),
}