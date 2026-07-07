import {Loader2} from 'lucide-react'
import {useTranslation} from 'react-i18next'

export default function LoadingBubble() {
    const {t} = useTranslation('chat')

    return (
        <div className="flex flex-col max-w-[80%] mr-auto items-start">
            <span className="text-[10px] text-muted-foreground mb-0.5 px-1 uppercase tracking-wider">
                {t('aiLabel')}
            </span>
            <div className="rounded-2xl px-4 py-2.5 text-sm bg-background border text-foreground rounded-tl-none flex items-center gap-2">
                <Loader2 size={14} className="animate-spin"/>
                <span className="text-muted-foreground">{t('thinking')}</span>
            </div>
        </div>
    )
}