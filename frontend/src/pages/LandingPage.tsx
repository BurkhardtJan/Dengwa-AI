import {useNavigate} from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import {LanguageSwitcher} from '../components/LanguageSwitcher'

function LandingPage() {
    const navigate = useNavigate()
    const {t} = useTranslation('landing')

    return (
        <div className="min-h-screen flex flex-col">

            {/* Nav */}
            <header className="flex justify-between items-center px-8 py-4 border-b">
                <span className="font-bold text-lg">Immersio AI</span>
                <div className="flex items-center gap-4">
                    <LanguageSwitcher/>
                    <button
                        onClick={() => navigate('/login')}
                        className="text-sm hover:underline"
                    >
                        {t('nav.login')}
                    </button>
                    <button
                        onClick={() => navigate('/signin')}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        {t('nav.register')}
                    </button>
                </div>
            </header>

            {/* Hero */}
            <section className="flex flex-col items-center justify-center text-center px-8 py-24 flex-1">
                <h1 className="text-5xl font-bold tracking-tight mb-4">
                    {t('hero.title')}
                </h1>
                <p className="text-xl text-muted-foreground max-w-xl mb-10">
                    {t('hero.subtitle')}
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/signin')}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                        {t('hero.cta')}
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-3 border rounded-lg font-medium hover:bg-muted transition-colors"
                    >
                        {t('hero.login')}
                    </button>
                </div>
            </section>

            {/* Features */}
            <section className="px-8 py-16 border-t bg-muted/30">
                <h2 className="text-2xl font-semibold text-center mb-10">
                    {t('features.title')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {(t('features.items', {returnObjects: true}) as {title: string, description: string}[]).map((item) => (
                        <div key={item.title} className="p-6 border rounded-lg bg-background">
                            <h3 className="font-semibold mb-2">{item.title}</h3>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section className="px-8 py-16 border-t">
                <h2 className="text-2xl font-semibold text-center mb-10">
                    {t('howItWorks.title')}
                </h2>
                <div className="flex flex-col md:flex-row justify-center gap-8 max-w-3xl mx-auto">
                    {(t('howItWorks.steps', {returnObjects: true}) as {step: string, label: string}[]).map((item, i) => (
                        <div key={i} className="flex flex-col items-center text-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                                {i + 1}
                            </span>
                            <p className="text-sm font-medium">{item.step}</p>
                            <p className="text-xs text-muted-foreground">{item.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="px-8 py-16 border-t text-center">
                <h2 className="text-2xl font-semibold mb-4">{t('cta.title')}</h2>
                <p className="text-muted-foreground mb-8">{t('cta.subtitle')}</p>
                <button
                    onClick={() => navigate('/signin')}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                    {t('cta.button')}
                </button>
            </section>

            {/* Footer */}
            <footer className="px-8 py-6 border-t text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} Immersio AI
            </footer>
        </div>
    )
}

export default LandingPage