import {useState} from 'react'
import {login} from '../services/auth.service'
import {useNavigate} from 'react-router-dom'

function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        try {
            const data = await login(username, password)
            localStorage.setItem('token', data.access_token)
            console.log('Token:', data.access_token)
            navigate('/dashboard')
        } catch {
            setError('Falsche Anmeldedaten')
        }
    }


    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-full max-w-md p-8">
                <h1 className="text-3xl font-bold mb-2">Willkommen</h1>
                <p className="text-muted-foreground mb-8">Melde dich bei Immersio AI an</p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="Benutzername"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">Passwort</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="••••••••"
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <button
                        type="submit"
                        className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium"
                    >
                        Anmelden
                    </button>
                </form>
            </div>
        </div>
    )
}

export default LoginPage