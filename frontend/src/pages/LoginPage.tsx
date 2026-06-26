import {useState} from 'react'
import {login} from '../services/auth.service'
import {useNavigate} from 'react-router-dom'
import {LanguageSwitcher} from '../components/LanguageSwitcher'
import {useTranslation} from 'react-i18next'

function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const {t} = useTranslation('auth')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        try {
            const data = await login(username, password)
            localStorage.setItem('token', data.access_token)
            navigate('/dashboard')
        } catch {
            setError(t('loginError'))
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="absolute top-4 right-4">
                <LanguageSwitcher/>
            </div>
            <div className="w-full max-w-md p-8">
                <h1 className="text-3xl font-bold mb-2">{t('loginTitle')}</h1>
                <p className="text-muted-foreground mb-8">{t('loginSubtitle')}</p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">{t('username')}</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder={t('usernamePlaceholder')}
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">{t('password')}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder={t('passwordPlaceholder')}
                        />
                    </div>
                    {error && <p className="text-destructive text-sm mb-4">{error}</p>}
                    <button
                        type="submit"
                        className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium"
                    >
                        {t('loginButton')}
                    </button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-6">
                    {t('noAccount')}{' '}
                    <button
                        onClick={() => navigate('/signin')}
                        className="underline hover:text-foreground"
                    >
                        {t('createAccount')}
                    </button>
                </p>
            </div>
        </div>
    )
}

export default LoginPage