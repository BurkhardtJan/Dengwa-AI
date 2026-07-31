import {useEffect, useRef} from 'react'
import {Link} from 'react-router-dom'
import {ExternalLink} from 'lucide-react'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {isAxiosError} from 'axios'
import {useTranslation} from 'react-i18next'
import {createChat} from '@/services/chat.service.ts'
import {useChatTree} from '@/hooks/useChatTree'
import ChatMessageList from '@/components/chat/ChatMessageList'
import ChatMessageInput from '@/components/chat/ChatMessageInput'

interface Props {
    /** Medium (or a language's dummy medium) the created chat is scoped to. */
    mediaId: string
    /**
     * Identifies this specific mini-chat usage site (e.g. a vocab card's id)
     * so each instance gets/keeps its own chat, even when several instances
     * share the same mediaId (e.g. the language dummy medium). Defaults to
     * mediaId, which is only correct if there's exactly one mini-chat per
     * mediaId.
     */
    instanceKey?: string
    /** Title to create the chat with, e.g. "Vokabel: casa". */
    title?: string
    /**
     * Builds the context text injected as a hidden "context" node before
     * each message, e.g. the current vocab card or game state. Called
     * fresh on every send so it always reflects the current state.
     */
    getContext?: () => string
}

export default function MiniChat({mediaId, instanceKey, title, getContext}: Props) {
    const {t} = useTranslation(['common', 'chat'])
    const cacheKey = instanceKey ?? mediaId

    // Creates its own chat as soon as it's mounted (i.e. once the host
    // module actually opens the mini-chat) — no chat is created just by
    // visiting a page that could show one. Modeled as a query (not a
    // mutation triggered from an effect) so React Query owns the fetch
    // scheduling instead of us setting state synchronously in an effect.
    // Default gcTime is kept (NOT 0) — with gcTime 0, React 18 StrictMode's
    // dev-mode double-mount discards the cache between the two mounts and
    // creates two chats instead of deduping to one.
    const {data: chat, isError: isCreateError, refetch: retryCreate} = useQuery({
        queryKey: ['miniChatCreate', cacheKey],
        queryFn: () => createChat(mediaId, title),
        staleTime: Infinity,
        retry: false,
    })
    const chatId = chat?.id
    const queryClient = useQueryClient()

    const {
        displayPath, isSending, isRegenerating, pendingReplyForId, streamingText,
        switchSibling, getSiblingInfo, getSiblingMessages, selectBranch,
        sendNew, sendNewWithContext, sendEdit, regenerate, viewMode, error: historyError
    } = useChatTree(chatId)

    // The cached chat can outlive the actual chat on the server (e.g. a
    // dev DB reset). If loading its history 404s, drop the stale cache
    // entry so the query above creates a fresh chat on the next render.
    useEffect(() => {
        if (chatId && isAxiosError(historyError) && historyError.response?.status === 404) {
            queryClient.removeQueries({queryKey: ['miniChatCreate', cacheKey], exact: true})
        }
    }, [chatId, historyError, cacheKey, queryClient])

    const lastContextRef = useRef<string | null>(null)

    const handleSend = (message: string) => {
        const context = getContext?.()
        if (context && context !== lastContextRef.current) {
            lastContextRef.current = context
            sendNewWithContext(message, context)
        } else {
            sendNew(message)
        }
    }

    return (
        <div className="flex flex-col h-105 border rounded-lg bg-background p-3">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('chat:miniChatTitle')}
                </span>
                {chatId && (
                    <Link
                        to={`/chat/${chatId}`}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                        {t('chat:openFullChat')}
                        <ExternalLink size={12}/>
                    </Link>
                )}
            </div>

            {isCreateError ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                    <p>{t('chat:startError')}</p>
                    <button onClick={() => retryCreate()} className="text-primary hover:underline">
                        {t('common:buttons.retry')}
                    </button>
                </div>
            ) : !chatId ? (
                <p className="text-xs text-muted-foreground italic flex-1 flex items-center justify-center">
                    {t('chat:starting')}
                </p>
            ) : (
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
            )}
            <ChatMessageInput isSending={isSending || !chatId} onSend={handleSend}/>
        </div>
    )
}