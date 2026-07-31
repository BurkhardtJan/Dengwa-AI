import {useState, useRef} from 'react'
import {useTranslation} from 'react-i18next'

interface Props {
    isSending: boolean
    onSend: (message: string) => void
}

export default function ChatMessageInput({isSending, onSend}: Props) {
    const {t} = useTranslation('chat')
    const [value, setValue] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value)
        const el = textareaRef.current
        if (el) {
            el.style.height = 'auto'
            el.style.height = `${el.scrollHeight}px`
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!value.trim() || isSending) return
        onSend(value.trim())
        setValue('')
        const el = textareaRef.current
        if (el) el.style.height = 'auto'
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
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