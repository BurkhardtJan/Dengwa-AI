import {useTranslation} from 'react-i18next'
import {X} from 'lucide-react'
import {useChatProviders} from '@/hooks/useModelOptions'
import ProviderModelSelect from './ProviderModelSelect'
import EmbeddingSelect from './EmbeddingSelect'
import type {ModelChoice} from '@/hooks/useChatTree'

interface Props {
    value: ModelChoice
    onChange: (choice: ModelChoice) => void
    onRemove?: () => void
    label: string
}

const DEFAULT_TEMPERATURE = 1.0

export default function ModelConfigFields({value, onChange, onRemove, label}: Props) {
    const {t} = useTranslation('chat')
    const {data: chatProviders, isLoading: isChatLoading} = useChatProviders()

    return (
        <div className="border rounded-md p-2 flex flex-col gap-2 bg-background/50">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {label}
                </span>
                {onRemove && (
                    <button onClick={onRemove} className="text-muted-foreground hover:text-destructive">
                        <X size={12}/>
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground">{t('settings.chatModel')}</span>
                <ProviderModelSelect
                    providers={chatProviders?.providers}
                    isLoading={isChatLoading}
                    provider={value.provider}
                    model={value.model}
                    onProviderChange={(provider) => onChange({...value, provider, model: null})}
                    onModelChange={(model) => onChange({...value, model})}
                />
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground">{t('settings.embeddingModel')}</span>
                <EmbeddingSelect
                    value={value.embeddingModel}
                    onChange={(embeddingModel) => onChange({...value, embeddingModel})}
                />
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground">
                    {t('settings.temperature')}: {(value.temperature ?? DEFAULT_TEMPERATURE).toFixed(1)}
                </span>
                <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.1}
                    value={value.temperature ?? DEFAULT_TEMPERATURE}
                    onChange={(e) => onChange({...value, temperature: parseFloat(e.target.value)})}
                    className="w-full"
                />
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground">{t('settings.maxTokens')}</span>
                <input
                    type="number"
                    min={1}
                    placeholder={t('settings.maxTokensPlaceholder') ?? 'unlimited'}
                    value={value.maxTokens ?? ''}
                    onChange={(e) => onChange({
                        ...value,
                        maxTokens: e.target.value === '' ? null : parseInt(e.target.value, 10)
                    })}
                    className="w-full border rounded-md px-2 py-1 text-xs bg-background"
                />
            </div>
        </div>
    )
}