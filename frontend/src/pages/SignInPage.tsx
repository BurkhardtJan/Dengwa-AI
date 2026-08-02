import {useState} from 'react'
import {register} from '../services/auth.service'
import {useNavigate} from 'react-router-dom'
import {LanguageSwitcher} from '../components/LanguageSwitcher'
import LanguagePickerModal from '@/components/LanguagePickerModal'
import {CURATED_LANGUAGE_CODES, getLanguageDisplayName} from '@/lib/languages'
import {useTranslation} from 'react-i18next'

function SignInPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [nativeLanguage, setNativeLanguage] = useState('de')
    const [showPicker, setShowPicker] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const {t, i18n} = useTranslation(['auth', 'common'])

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
            <div className="absolute top-4 right-4">
                <LanguageSwitcher/>
            </div>
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
                            value={CURATED_LANGUAGE_CODES.includes(nativeLanguage as typeof CURATED_LANGUAGE_CODES[number]) ? nativeLanguage : ''}
                            onChange={e => {
                                if (e.target.value === '__all__') {
                                    setShowPicker(true)
                                } else {
                                    setNativeLanguage(e.target.value)
                                }
                            }}
                            className="w-full border rounded-lg px-3 py-2 bg-background"
                        >
                            {CURATED_LANGUAGE_CODES.map(code => (
                                <option key={code} value={code}>{getLanguageDisplayName(code, i18n.language)}</option>
                            ))}
                            <option value="__all__"
                                    className="text-primary">{t('common:languagePicker.allLanguages')}</option>
                        </select>
                        {!CURATED_LANGUAGE_CODES.includes(nativeLanguage as typeof CURATED_LANGUAGE_CODES[number]) && (
                            <p className="text-xs text-muted-foreground mt-1.5">
                                {t('common:languagePicker.selected')}: <span
                                className="font-medium">{getLanguageDisplayName(nativeLanguage, i18n.language)}</span>
                            </p>
                        )}
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

                {showPicker && (
                    <LanguagePickerModal
                        onClose={() => setShowPicker(false)}
                        onSelect={(value) => {
                            setNativeLanguage(value)
                            setShowPicker(false)
                        }}
                    />
                )}
            </div>
        </div>
    )
}

export default SignInPage