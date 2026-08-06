import {useTranslation} from 'react-i18next'
import type {ModelChoice} from '@/hooks/useChatTree'

interface Props {
    configs: ModelChoice[]
    streamingTexts: (string | null)[]
}

/** Same grid layout as CompareView, but for replies still streaming in - no
 * click-to-select yet since nothing's persisted. Shows a pulsing cursor per
 * column so it's clear that slot is still generating, even before its first
 * token arrives. */
export default function PendingCompareView({configs, streamingTexts}: Props) {
    const {t} = useTranslation('chat')

    return (
        <div className="w-full mr-auto max-w-full">
            <span className="text-[10px] text-muted-foreground mb-1 px-1 uppercase tracking-wider block">
                {t('aiLabel')}
            </span>
            <div className="grid gap-2" style={{gridTemplateColumns: `repeat(${configs.length}, minmax(0, 1fr))`}}>
                {configs.map((cfg, i) => {
                    const text = streamingTexts[i]
                    return (
                        <div key={i}
                             className="text-left border rounded-xl p-3 bg-background flex flex-col gap-1.5 min-w-0">
                            <span
                                className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">
                                {cfg.model ?? cfg.provider ?? t('defaultModel')}
                            </span>
                            <p className="text-sm whitespace-pre-wrap break-words">
                                {text}
                                <span
                                    className="inline-block w-1.5 h-3.5 ml-0.5 bg-muted-foreground/50 animate-pulse align-middle"/>
                            </p>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}