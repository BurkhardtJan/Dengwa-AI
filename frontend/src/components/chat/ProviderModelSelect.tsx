import {useTranslation} from 'react-i18next'

interface Props {
    providers: Record<string, string[]> | undefined
    isLoading: boolean
    provider: string | null
    model: string | null
    onProviderChange: (provider: string | null) => void
    onModelChange: (model: string | null) => void
    showModelSelect?: boolean
}

export default function ProviderModelSelect({
    providers, isLoading, provider, model,
    onProviderChange, onModelChange, showModelSelect = true
}: Props) {
    const {t} = useTranslation('chat')

    const availableProviders = providers
        ? Object.entries(providers).filter(([, models]) => models.length > 0)
        : []

    const modelsForProvider = provider && providers ? providers[provider] ?? [] : []

    return (
        <div className="flex gap-1.5">
            <select
                value={provider ?? ''}
                onChange={(e) => {
                    onProviderChange(e.target.value || null)
                }}
                disabled={isLoading}
                className="text-xs border rounded-md px-2 py-1 bg-background disabled:opacity-50"
            >
                <option value="">{t('settings.default')}</option>
                {availableProviders.map(([name]) => (
                    <option key={name} value={name}>{name}</option>
                ))}
            </select>

            {showModelSelect && provider && (
                <select
                    value={model ?? ''}
                    onChange={(e) => onModelChange(e.target.value || null)}
                    disabled={isLoading || modelsForProvider.length === 0}
                    className="text-xs border rounded-md px-2 py-1 bg-background disabled:opacity-50"
                >
                    <option value="">{t('settings.default')}</option>
                    {modelsForProvider.map((m) => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
            )}
        </div>
    )
}