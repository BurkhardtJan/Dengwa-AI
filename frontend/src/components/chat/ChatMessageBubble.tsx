import {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {ChevronLeft, ChevronRight, Pencil, RotateCw} from 'lucide-react'
import type {components} from '@/types/api'

type ChatMessage = components['schemas']['ChatMessageResponse']

interface Props {
    message: ChatMessage
    siblingIndex: number
    siblingCount: number
    isSending: boolean
    isRegenerating: boolean
    onSwitchSibling: (direction: 'prev' | 'next') => void
    onEditSubmit: (newText: string) => void
    onRegenerate: () => void
}

export default function ChatMessageBubble({
                                              message, siblingIndex, siblingCount, isSending, isRegenerating,
                                              onSwitchSibling, onEditSubmit, onRegenerate
                                          }: Props) {
    const {t, i18n} = useTranslation(['chat', 'common'])
    const [isEditing, setIsEditing] = useState(false)
    const [editText, setEditText] = useState(message.message)

    const isAi = message.role === 'assistant' || message.role === 'ai'
    const hasSiblings = siblingCount > 1

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!editText.trim() || isSending) return
        onEditSubmit(editText.trim())
        setIsEditing(false)
    }

    return (
        <div className={`group flex flex-col max-w-[80%] ${isAi ? 'mr-auto items-start' : 'ml-auto items-end'}`}>
            <span className="text-[10px] text-muted-foreground mb-0.5 px-1 uppercase tracking-wider">
                {isAi ? t('aiLabel') : t('userLabel')}
                {isAi && (message.model || message.provider) && (
                    <span className="ml-1.5 normal-case tracking-normal opacity-70">
                        · {message.model ?? message.provider}
                    </span>
                )}
            </span>

            {isEditing ? (
                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-1.5">
                    <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        autoFocus
                        rows={3}
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(false)
                                setEditText(message.message)
                            }}
                            className="text-xs text-muted-foreground hover:underline px-2 py-1"
                        >
                            {t('common:buttons.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={!editText.trim() || isSending}
                            className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
                        >
                            {isSending ? t('sending') : t('common:buttons.save')}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="relative flex items-center gap-1">
                    {!isAi && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-1"
                            title={t('common:buttons.edit')}
                        >
                            <Pencil size={13}/>
                        </button>
                    )}
                    <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                        isAi
                            ? 'bg-background border text-foreground rounded-tl-none'
                            : 'bg-primary text-primary-foreground rounded-tr-none'
                    }`}>
                        <p className="whitespace-pre-wrap">{message.message}</p>
                    </div>
                    {isAi && (
                        <button
                            onClick={onRegenerate}
                            disabled={isRegenerating}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-1 disabled:opacity-50"
                            title={t('regenerate')}
                        >
                            <RotateCw size={13} className={isRegenerating ? 'animate-spin' : ''}/>
                        </button>
                    )}
                </div>
            )}

            <div className="flex items-center gap-1.5 mt-0.5 px-1">
                {hasSiblings && !isEditing && (
                    <div className="flex items-center gap-0.5 text-muted-foreground">
                        <button
                            onClick={() => onSwitchSibling('prev')}
                            disabled={siblingIndex <= 0}
                            className="hover:text-foreground disabled:opacity-30"
                        >
                            <ChevronLeft size={12}/>
                        </button>
                        <span className="text-[10px] tabular-nums">
                            {siblingIndex + 1}/{siblingCount}
                        </span>
                        <button
                            onClick={() => onSwitchSibling('next')}
                            disabled={siblingIndex >= siblingCount - 1}
                            className="hover:text-foreground disabled:opacity-30"
                        >
                            <ChevronRight size={12}/>
                        </button>
                    </div>
                )}
                <span className="text-[10px] text-muted-foreground">
                    {new Date(message.timestamp).toLocaleTimeString(i18n.language, {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </span>
            </div>
        </div>
    )
}