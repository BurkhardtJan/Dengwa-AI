import {Loader2, Volume2, VolumeX} from 'lucide-react'
import {useTranslation} from 'react-i18next'
import {useTextToSpeech} from '@/hooks/useTextToSpeech'
import {stripMarkdownForSpeech} from '@/lib/speech/stripMarkdownForSpeech'
import {toBcp47} from '@/lib/speech/languageCodes'

interface Props {
    text: string
    lang: string
    size?: number
    className?: string
}

export default function SpeakButton({text, lang, size = 14, className = ''}: Props) {
    const {t} = useTranslation('common')
    const {speak, stop, isSpeaking, status, isSupported} = useTextToSpeech()

    if (!isSupported || !text.trim()) return null

    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation()
                isSpeaking ? stop() : speak(stripMarkdownForSpeech(text), toBcp47(lang))
            }}
            className={`text-muted-foreground hover:text-foreground transition-colors p-1 ${className}`}
            title={status ? status.label : t(isSpeaking ? 'speakStop' : 'speakStart')}
        >
            {status
                ? <Loader2 size={size} className="animate-spin"/>
                : isSpeaking ? <VolumeX size={size}/> : <Volume2 size={size}/>}
        </button>
    )
}