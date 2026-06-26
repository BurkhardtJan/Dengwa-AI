import {useState} from 'react'
import {register} from '../services/auth.service'
import {useNavigate} from 'react-router-dom'
import {useTranslation} from 'react-i18next'

function SignInPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [nativeLanguage, setNativeLanguage] = useState('de')
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const {t} = useTranslation('auth')

    async function handleSignin(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        try {
            await register(username, password, nativeLanguage)
            navigate('/login')
        } catch {
            setError(t('registerError'))
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-full max-w-md p-8">
                <h1 className="text-3xl font-bold mb-2">{t('registerTitle')}</h1>
                <p className="text-muted-foreground mb-8">{t('registerSubtitle')}</p>

                <form onSubmit={handleSignin}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">{t('username')}</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder={t('usernamePlaceholder')}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">{t('password')}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder={t('passwordPlaceholder')}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">{t('nativeLanguage')}</label>
                        <select
                            value={nativeLanguage}
                            onChange={e => setNativeLanguage(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 bg-background"
                        >
                            {Object.entries({de: 'de', en: 'en', fr: 'fr', es: 'es'}).map(([value]) => (
                                <option key={value} value={value}>
                                    {t(`languages.${value}`)}
                                </option>
                            ))}
                        </select>
                    </div>
                    {error && <p className="text-destructive text-sm mb-4">{error}</p>}
                    <button
                        type="submit"
                        className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium"
                    >
                        {t('registerButton')}
                    </button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-6">
                    {t('hasAccount')}{' '}
                    <button
                        onClick={() => navigate('/login')}
                        className="underline hover:text-foreground"
                    >
                        {t('loginButton')}
                    </button>
                </p>
            </div>
        </div>
    )
}

export default SignInPage