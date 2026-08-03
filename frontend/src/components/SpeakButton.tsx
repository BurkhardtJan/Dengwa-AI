import {Volume2, VolumeX} from 'lucide-react'
import {useTranslation} from 'react-i18next'
import {useTextToSpeech} from '@/hooks/useTextToSpeech'
import {stripMarkdownForSpeech} from '@/lib/speech/stripMarkdownForSpeech'
import {toBcp47} from '@/lib/speech/languageCodes'

interface Props {
    text: string
    /** Language the text is written in — a learning_language value (ISO code or, for legacy entries, free text). */
    lang: string
    size?: number
    className?: string
}

/**
 * Renders nothing if no TTS engine is available/supported — callers don't
 * need to check isSupported themselves.
 */
export default function SpeakButton({text, lang, size = 14, className = ''}: Props) {
    const {t} = useTranslation('common')
    const {speak, stop, isSpeaking, isSupported} = useTextToSpeech()

    if (!isSupported || !text.trim()) return null

    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation() // these buttons often sit inside clickable list rows
                isSpeaking ? stop() : speak(stripMarkdownForSpeech(text), toBcp47(lang))
            }}
            className={`text-muted-foreground hover:text-foreground transition-colors p-1 ${className}`}
            title={t(isSpeaking ? 'speakStop' : 'speakStart')}
        >
            {isSpeaking ? <VolumeX size={size}/> : <Volume2 size={size}/>}
        </button>
    )
}