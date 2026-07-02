import {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Settings, ChevronDown, ChevronUp} from 'lucide-react'
import type {ModelChoice, ViewMode} from '@/hooks/useChatTree'

interface Props {
    value: ModelChoice
    onChange: (choice: ModelChoice) => void
    viewMode: ViewMode
    onViewModeChange: (mode: ViewMode) => void
}

export default function ChatSettings({value, onChange, viewMode, onViewModeChange}: Props) {
    const {t} = useTranslation('chat')
    const [isOpen, setIsOpen] = useState(false)

    const updateField = (field: keyof ModelChoice, raw: string) => {
        onChange({...value, [field]: raw.trim() === '' ? null : raw.trim()})
    }

    return (
        <div className="border rounded-lg bg-muted/10">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <span className="flex items-center gap-1.5">
                    <Settings size={14}/>
                    {t('settings.title')}
                </span>
                {isOpen ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            </button>

            {isOpen && (
                <div className="px-3 pb-3 flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                        <label className="flex flex-col gap-1">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                {t('settings.provider')}
                            </span>
                            <input
                                type="text"
                                value={value.provider ?? ''}
                                onChange={(e) => updateField('provider', e.target.value)}
                                placeholder={t('settings.providerPlaceholder')}
                                className="border rounded-md px-2 py-1 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </label>

                        <label className="flex flex-col gap-1">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                {t('settings.model')}
                            </span>
                            <input
                                type="text"
                                value={value.model ?? ''}
                                onChange={(e) => updateField('model', e.target.value)}
                                placeholder={t('settings.modelPlaceholder')}
                                className="border rounded-md px-2 py-1 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </label>

                        <label className="flex flex-col gap-1">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                {t('settings.embeddingModel')}
                            </span>
                            <input
                                type="text"
                                value={value.embeddingModel ?? ''}
                                onChange={(e) => updateField('embeddingModel', e.target.value)}
                                placeholder={t('settings.embeddingModelPlaceholder')}
                                className="border rounded-md px-2 py-1 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </label>
                    </div>

                    <p className="text-[10px] text-muted-foreground italic">
                        {t('settings.hint')}
                    </p>

                    <div className="flex flex-col gap-1 pt-2 border-t">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            {t('settings.viewMode')}
                        </span>
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => onViewModeChange('switch')}
                                className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                                    viewMode === 'switch'
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {t('settings.viewModeSwitch')}
                            </button>
                            <button
                                onClick={() => onViewModeChange('sbs')}
                                className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                                    viewMode === 'sbs'
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {t('settings.viewModeSbs')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}