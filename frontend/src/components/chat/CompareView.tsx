import {useTranslation} from 'react-i18next'
import type {components} from '@/types/api'

type ChatMessage = components['schemas']['ChatMessageResponse']

interface Props {
    siblings: ChatMessage[]
    activeId: string
    onSelect: (messageId: string) => void
}

export default function CompareView({siblings, activeId, onSelect}: Props) {
    const {t, i18n} = useTranslation('chat')

    return (
        <div className="w-full mr-auto max-w-full">
            <span className="text-[10px] text-muted-foreground mb-1 px-1 uppercase tracking-wider block">
                {t('aiLabel')}
            </span>
            <div className="grid gap-2" style={{gridTemplateColumns: `repeat(${siblings.length}, minmax(0, 1fr))`}}>
                {siblings.map(msg => {
                    const isActive = msg.id === activeId
                    return (
                        <button
                            key={msg.id}
                            onClick={() => onSelect(msg.id)}
                            className={`text-left border rounded-xl p-3 bg-background flex flex-col gap-1.5 min-w-0 transition-colors ${
                                isActive ? 'border-primary ring-1 ring-primary' : 'hover:border-foreground/30'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">
                                    {msg.model ?? msg.provider ?? t('defaultModel')}
                                </span>
                                {isActive && (
                                    <span className="text-[9px] text-primary font-medium shrink-0">
                                        {t('settings.continueFrom')}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                            <span className="text-[10px] text-muted-foreground mt-1">
                                {new Date(msg.timestamp).toLocaleTimeString(i18n.language, {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}