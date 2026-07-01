import {useEffect, useRef} from 'react'
import {useTranslation} from 'react-i18next'
import ChatMessageBubble from './ChatMessageBubble'
import type {components} from '@/types/api'

type ChatMessage = components['schemas']['ChatMessageResponse']

interface Props {
    messages: ChatMessage[]
    isSending: boolean
    getSiblingInfo: (messageId: string) => { index: number; count: number }
    onSwitchSibling: (messageId: string, direction: 'prev' | 'next') => void
    onEditSubmit: (messageId: string, newText: string, originalParentId: string | null | undefined) => void
}

export default function ChatMessageList({messages, isSending, getSiblingInfo, onSwitchSibling, onEditSubmit}: Props) {
    const {t} = useTranslation('chat')
    const endRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        endRef.current?.scrollIntoView({behavior: 'smooth'})
    }, [messages])

    return (
        <div className="flex-1 border rounded-lg p-4 bg-muted/20 overflow-y-auto min-h-[350px] space-y-4 mb-4">
            {messages.length === 0 ? (
                <p className="text-muted-foreground text-sm italic text-center mt-4">
                    {t('emptyHistory')}
                </p>
            ) : (
                messages.map((msg) => {
                    const {index, count} = getSiblingInfo(msg.id)
                    return (
                        <ChatMessageBubble
                            key={msg.id}
                            message={msg}
                            siblingIndex={index}
                            siblingCount={count}
                            isSending={isSending}
                            onSwitchSibling={(direction) => onSwitchSibling(msg.id, direction)}
                            onEditSubmit={(newText) => onEditSubmit(msg.id, newText, msg.parent_id)}
                        />
                    )
                })
            )}
            <div ref={endRef}/>
        </div>
    )
}