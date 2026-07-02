import {useTranslation} from 'react-i18next'
import {X} from 'lucide-react'
import type {ModelChoice} from '@/hooks/useChatTree'

interface Props {
    value: ModelChoice
    onChange: (choice: ModelChoice) => void
    onRemove?: () => void
    label: string
}

export default function ModelConfigFields({value, onChange, onRemove, label}: Props) {
    const {t} = useTranslation('chat')

    const updateField = (field: keyof ModelChoice, raw: string) => {
        onChange({...value, [field]: raw.trim() === '' ? null : raw.trim()})
    }

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

            <input
                type="text"
                value={value.provider ?? ''}
                onChange={(e) => updateField('provider', e.target.value)}
                placeholder={t('settings.providerPlaceholder')}
                className="border rounded-md px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
                type="text"
                value={value.model ?? ''}
                onChange={(e) => updateField('model', e.target.value)}
                placeholder={t('settings.modelPlaceholder')}
                className="border rounded-md px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
                type="text"
                value={value.embeddingModel ?? ''}
                onChange={(e) => updateField('embeddingModel', e.target.value)}
                placeholder={t('settings.embeddingModelPlaceholder')}
                className="border rounded-md px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
        </div>
    )
}