import {useState} from 'react'
import {useTranslation} from 'react-i18next'

interface Props {
    isSending: boolean
    onSend: (message: string) => void
}

export default function ChatMessageInput({isSending, onSend}: Props) {
    const {t} = useTranslation('chat')
    const [value, setValue] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!value.trim() || isSending) return
        onSend(value.trim())
        setValue('')
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={t('inputPlaceholder')}
                disabled={isSending}
                className="flex-1 border rounded-lg px-4 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
            />
            <button
                type="submit"
                disabled={!value.trim() || isSending}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
                {isSending ? t('sending') : t('sendButton')}
            </button>
        </form>
    )
}