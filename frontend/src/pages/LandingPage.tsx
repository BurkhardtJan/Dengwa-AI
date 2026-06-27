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
                <span className="font-bold text-lg tracking-tight">Dengwa AI</span>
                <div className="flex items-center gap-4">
                    <LanguageSwitcher/>
                    <button
                        onClick={() => navigate('/login')}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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
            <section className="flex flex-col items-center justify-center text-center px-8 py-28 flex-1">
                <p className="text-xs font-mono tracking-widest text-muted-foreground mb-6 uppercase">
                    {t('hero.eyebrow')}
                </p>
                <h1 className="text-5xl font-bold tracking-tight mb-5 max-w-2xl leading-tight">
                    {t('hero.title')}
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg mb-10 leading-relaxed">
                    {t('hero.subtitle')}
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/signin')}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                        {t('hero.cta')}
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-3 border rounded-lg font-medium text-muted-foreground hover:bg-muted transition-colors"
                    >
                        {t('hero.login')}
                    </button>
                </div>
            </section>

            {/* Features */}
            <section className="px-8 py-20 border-t bg-muted/30">
                <h2 className="text-2xl font-semibold text-center mb-12">
                    {t('features.title')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {(t('features.items', {returnObjects: true}) as {icon: string, title: string, description: string}[]).map((item) => (
                        <div key={item.title} className="p-6 border rounded-xl bg-background">
                            <span className="text-2xl mb-4 block">{item.icon}</span>
                            <h3 className="font-semibold mb-2">{item.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section className="px-8 py-20 border-t">
                <h2 className="text-2xl font-semibold text-center mb-12">
                    {t('howItWorks.title')}
                </h2>
                <div className="flex flex-col md:flex-row justify-center items-start gap-0 max-w-3xl mx-auto relative">
                    {(t('howItWorks.steps', {returnObjects: true}) as {step: string, label: string}[]).map((item, i, arr) => (
                        <div key={i} className="flex flex-col items-center text-center flex-1 relative">
                            {/* Connector line between steps */}
                            {i < arr.length - 1 && (
                                <div className="hidden md:block absolute top-4 left-1/2 w-full h-px bg-border z-0" />
                            )}
                            <span className="relative z-10 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center mb-3">
                                {i + 1}
                            </span>
                            <p className="text-sm font-semibold mb-1">{item.step}</p>
                            <p className="text-xs text-muted-foreground max-w-[120px]">{item.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Etymology note */}
            <section className="px-8 py-8 border-t bg-muted/20">
                <p className="text-center text-xs text-muted-foreground max-w-xl mx-auto leading-relaxed font-mono">
                    {t('etymology.text')}
                </p>
            </section>

            {/* CTA */}
            <section className="px-8 py-20 border-t text-center">
                <h2 className="text-2xl font-semibold mb-3">{t('cta.title')}</h2>
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
                © {new Date().getFullYear()} Dengwa AI
            </footer>
        </div>
    )
}

export default LandingPage
