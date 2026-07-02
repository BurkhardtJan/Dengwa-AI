import {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Settings, ChevronDown, ChevronUp, Plus} from 'lucide-react'
import ModelConfigFields from './ModelConfigFields'
import type {ModelChoice, ViewMode} from '@/hooks/useChatTree'

interface Props {
    configs: ModelChoice[]
    onAddConfig: () => void
    onRemoveConfig: (index: number) => void
    onUpdateConfig: (index: number, choice: ModelChoice) => void
    viewMode: ViewMode
    onViewModeChange: (mode: ViewMode) => void
}

export default function ChatSettings({
    configs, onAddConfig, onRemoveConfig, onUpdateConfig, viewMode, onViewModeChange
}: Props) {
    const {t} = useTranslation('chat')
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="border rounded-lg bg-muted/10">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <span className="flex items-center gap-1.5">
                    <Settings size={14}/>
                    {t('settings.title')}
                    {configs.length > 1 && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                            {configs.length}×
                        </span>
                    )}
                </span>
                {isOpen ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            </button>

            {isOpen && (
                <div className="px-3 pb-3 flex flex-col gap-3">
                    <div className="grid gap-2" style={{gridTemplateColumns: `repeat(${Math.min(configs.length, 3)}, 1fr)`}}>
                        {configs.map((cfg, i) => (
                            <ModelConfigFields
                                key={i}
                                value={cfg}
                                onChange={(choice) => onUpdateConfig(i, choice)}
                                onRemove={configs.length > 1 ? () => onRemoveConfig(i) : undefined}
                                label={i === 0 ? t('settings.primary') : `${t('settings.compareLabel')} ${i}`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={onAddConfig}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground self-start"
                    >
                        <Plus size={13}/>
                        {t('settings.addConfig')}
                    </button>

                    <p className="text-[10px] text-muted-foreground italic">
                        {t('settings.hint')}
                        {configs.length > 1 && ` ${t('settings.multiHint')}`}
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