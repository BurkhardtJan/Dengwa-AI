import {Link} from 'react-router-dom'
import {ExternalLink} from 'lucide-react'
import {useTranslation} from 'react-i18next'
import {useChatTree} from '@/hooks/useChatTree'
import ChatMessageList from '@/components/chat/ChatMessageList'
import ChatMessageInput from '@/components/chat/ChatMessageInput'

interface Props {
    /** Chat this widget talks to — the host module owns creation/reuse of this id. */
    chatId: string
    /**
     * Builds the context text injected as a hidden "context" node before
     * each message, e.g. the current vocab card or game state. Called
     * fresh on every send so it always reflects the current state.
     */
    getContext?: () => string
}

export default function MiniChat({chatId, getContext}: Props) {
    const {t} = useTranslation('chat')
    const {
        displayPath, isSending, isRegenerating, pendingReplyForId, streamingText,
        switchSibling, getSiblingInfo, getSiblingMessages, selectBranch,
        sendNew, sendNewWithContext, sendEdit, regenerate, viewMode
    } = useChatTree(chatId)

    const handleSend = (message: string) => {
        const context = getContext?.()
        if (context) {
            sendNewWithContext(message, context)
        } else {
            sendNew(message)
        }
    }

    return (
        <div className="flex flex-col h-105 border rounded-lg bg-background p-3">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('miniChatTitle')}
                </span>
                <Link
                    to={`/chat/${chatId}`}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                    {t('openFullChat')}
                    <ExternalLink size={12}/>
                </Link>
            </div>

            <ChatMessageList
                messages={displayPath}
                isSending={isSending}
                isRegenerating={isRegenerating}
                pendingReplyForId={pendingReplyForId}
                streamingText={streamingText}
                viewMode={viewMode}
                getSiblingInfo={getSiblingInfo}
                getSiblingMessages={getSiblingMessages}
                onSwitchSibling={switchSibling}
                onSelectBranch={selectBranch}
                onEditSubmit={(_id, newText, originalParentId) => sendEdit(newText, originalParentId)}
                onRegenerate={regenerate}
            />
            <ChatMessageInput isSending={isSending} onSend={handleSend}/>
        </div>
    )
}