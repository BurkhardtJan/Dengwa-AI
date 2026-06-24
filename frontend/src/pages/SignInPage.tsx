import { useState } from 'react'
import { register } from '../services/auth.service'
import { useNavigate } from 'react-router-dom'

function SignInPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [nativeLanguage, setNativeLanguage] = useState('de')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    async function handleSignin(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        try {
            await register(username, password, nativeLanguage)
            navigate('/login')
        } catch {
            setError('Registrierung fehlgeschlagen – Username bereits vergeben?')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-full max-w-md p-8">
                <h1 className="text-3xl font-bold mb-2">Account erstellen</h1>
                <p className="text-muted-foreground mb-8">Neu bei Immersio AI? Los geht's.</p>

                <form onSubmit={handleSignin}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="Benutzername"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Passwort</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">Muttersprache</label>
                        <select
                            value={nativeLanguage}
                            onChange={e => setNativeLanguage(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 bg-background"
                        >
                            <option value="de">Deutsch</option>
                            <option value="en">Englisch</option>
                            <option value="fr">Französisch</option>
                            <option value="es">Spanisch</option>
                        </select>
                    </div>

                    {error && <p className="text-destructive text-sm mb-4">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium"
                    >
                        Account erstellen
                    </button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-6">
                    Schon einen Account?{' '}
                    <button
                        onClick={() => navigate('/login')}
                        className="underline hover:text-foreground"
                    >
                        Anmelden
                    </button>
                </p>
            </div>
        </div>
    )
}

export default SignInPage