import {Fragment, useEffect, useRef} from 'react'
import {useTranslation} from 'react-i18next'
import ChatMessageBubble from './ChatMessageBubble'
import CompareView from './CompareView'
import LoadingBubble from './LoadingBubble'
import {PENDING_USER_MESSAGE_ID} from '@/utils/tree.utils'
import type {components} from '@/types/api'
import type {ViewMode} from '@/hooks/useChatTree'

type ChatMessage = components['schemas']['ChatMessageResponse']

interface Props {
    messages: ChatMessage[]
    isSending: boolean
    isRegenerating: boolean
    pendingReplyForId: string | null
    viewMode: ViewMode
    getSiblingInfo: (messageId: string) => { index: number; count: number }
    getSiblingMessages: (messageId: string) => ChatMessage[]
    onSwitchSibling: (messageId: string, direction: 'prev' | 'next') => void
    onSelectBranch: (messageId: string) => void
    onEditSubmit: (messageId: string, newText: string, originalParentId: string | null | undefined) => void
    onRegenerate: (userMessageId: string) => void
}

export default function ChatMessageList({
                                            messages, isSending, isRegenerating, pendingReplyForId, viewMode,
                                            getSiblingInfo, getSiblingMessages, onSwitchSibling, onSelectBranch,
                                            onEditSubmit, onRegenerate
                                        }: Props) {
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
                    if (msg.id === PENDING_USER_MESSAGE_ID) {
                        return (
                            <Fragment key={msg.id}>
                                <div className="flex flex-col max-w-[80%] ml-auto items-end opacity-70">
                                    <span
                                        className="text-[10px] text-muted-foreground mb-0.5 px-1 uppercase tracking-wider">
                                        {t('userLabel')}
                                    </span>
                                    <div
                                        className="rounded-2xl px-4 py-2.5 text-sm bg-primary text-primary-foreground rounded-tr-none">
                                        <p className="whitespace-pre-wrap">{msg.message}</p>
                                    </div>
                                </div>
                                {isSending && <LoadingBubble/>}
                            </Fragment>
                        )
                    }
                    const {index, count} = getSiblingInfo(msg.id)
                    const isAi = msg.role === 'assistant' || msg.role === 'ai'
                    const showRegenLoading = isAi && msg.parent_id === pendingReplyForId
                    if (isAi && count > 1 && viewMode === 'sbs') {
                        const siblings = getSiblingMessages(msg.id)
                        return (
                            <Fragment key={msg.parent_id ?? msg.id}>
                                <CompareView
                                    siblings={siblings}
                                    activeId={msg.id}
                                    onSelect={onSelectBranch}
                                />
                                {showRegenLoading && <LoadingBubble/>}
                            </Fragment>
                        )
                    }

                    return (
                        <Fragment key={msg.id}>
                            <ChatMessageBubble
                                message={msg}
                                siblingIndex={index}
                                siblingCount={count}
                                isSending={isSending}
                                isRegenerating={isRegenerating}
                                onSwitchSibling={(direction) => onSwitchSibling(msg.id, direction)}
                                onEditSubmit={(newText) => onEditSubmit(msg.id, newText, msg.parent_id)}
                                onRegenerate={() => isAi && msg.parent_id && onRegenerate(msg.parent_id)}
                            />
                            {showRegenLoading && <LoadingBubble/>}
                        </Fragment>
                    )
                })
            )}
            <div ref={endRef}/>
        </div>
    )
}