import {useEffect, useRef, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Mic, Square} from 'lucide-react'
import {useSpeechToText} from '@/hooks/useSpeechToText'
import {toBcp47} from '@/lib/speech/languageCodes'

interface Props {
    isSending: boolean
    onSend: (message: string) => void
    /** The chat's target learning language (Dengwa's free-text value, e.g. "Spanisch") — used for dictation, not the UI locale. */
    learningLanguage: string
}

export default function ChatMessageInput({isSending, onSend, learningLanguage}: Props) {
    const {t} = useTranslation('chat')
    const [value, setValue] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const {start, stop, isListening, transcript, isSupported: isSttSupported} = useSpeechToText()

    const resizeTextarea = () => {
        const el = textareaRef.current
        if (el) {
            el.style.height = 'auto'
            el.style.height = `${el.scrollHeight}px`
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value)
        resizeTextarea()
    }

    // Dictated text arrives outside the textarea's own onChange, so the
    // auto-resize has to be triggered here too.
    useEffect(() => {
        if (transcript) {
            setValue(transcript)
            resizeTextarea()
        }
    }, [transcript])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!value.trim() || isSending) return
        onSend(value.trim())
        setValue('')
        const el = textareaRef.current
        if (el) el.style.height = 'auto'
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    const toggleListening = () => {
        if (isListening) {
            stop()
        } else {
            start(toBcp47(learningLanguage))
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={t('inputPlaceholder')}
                disabled={isSending}
                rows={1}
                className="flex-1 border rounded-lg px-4 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 resize-none max-h-40 overflow-y-auto"
            />
            {isSttSupported && (
                <button
                    type="button"
                    onClick={toggleListening}
                    disabled={isSending}
                    title={t(isListening ? 'stopListening' : 'startListening')}
                    className={`px-3 py-2 rounded-lg text-sm border self-end transition-colors disabled:opacity-50 ${
                        isListening
                            ? 'bg-destructive text-destructive-foreground border-destructive'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    {isListening ? <Square size={16}/> : <Mic size={16}/>}
                </button>
            )}
            <button
                type="submit"
                disabled={!value.trim() || isSending}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity self-end"
            >
                {isSending ? t('sending') : t('sendButton')}
            </button>
        </form>
    )
}