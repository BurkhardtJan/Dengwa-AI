import {useEffect} from "react";
import {useParams, useNavigate} from 'react-router-dom'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {deleteChat, fetchChats, updateChatTitle} from '@/services/chat.service.ts'
import {useChatTree} from '@/hooks/useChatTree'
import ChatHeader from '@/components/chat/ChatHeader'
import ChatSettings from '@/components/chat/ChatSettings'
import ChatMessageList from '@/components/chat/ChatMessageList'
import ChatMessageInput from '@/components/chat/ChatMessageInput'
import {useTranslation} from 'react-i18next'
import {useMedium} from '@/context/MediumContext'

export default function ChatDetailPage() {
    const {id} = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const {t} = useTranslation('chat')

    const {
        displayPath, isLoading, isError, isSending, isRegenerating, pendingReplyForId, streamingText,
        switchSibling, getSiblingInfo, getSiblingMessages, selectBranch,
        sendNew, sendEdit, regenerate,
        configs, addConfig, removeConfig, updateConfig, viewMode, setViewMode
    } = useChatTree(id)

    const {data: chatMeta} = useQuery({
        queryKey: ['chatMeta', id],
        queryFn: async () => {
            const cached = queryClient.getQueryData<Awaited<ReturnType<typeof fetchChats>>>(['chat'])
            if (cached) {
                const found = cached.find(c => c.id === id)
                if (found) return found
            }
            const all = await fetchChats()
            return all.find(c => c.id === id) ?? null
        },
        enabled: !!id
    })


    const deleteMutation = useMutation({
        mutationFn: () => deleteChat(id!),
        onSuccess: () => {
            void queryClient.invalidateQueries({queryKey: ['chat']})
            navigate('/chat')
        }
    })

    const renameMutation = useMutation({
        mutationFn: (title: string) => updateChatTitle(id!, title),
        onSuccess: () => {
            void queryClient.invalidateQueries({queryKey: ['chatMeta', id]})
            void queryClient.invalidateQueries({queryKey: ['chat']})
        }
    })
    const {setMediumId} = useMedium()

    useEffect(() => {
        // Skip the language's implicit dummy medium (media_id === learning_id) —
        // it's not a real, selectable medium and would make the global filter
        // (used by e.g. the vocabulary list) show nothing.
        if (chatMeta?.media_id && chatMeta.media_id !== chatMeta.learning_id) {
            setMediumId(chatMeta.media_id)
        }
    }, [chatMeta?.media_id, chatMeta?.learning_id, setMediumId])

    if (isLoading) return <p className="p-8">{t('loading')}</p>
    if (isError) return <p className="p-8 text-destructive">{t('errorLoading')}</p>


    return (
        <div className="p-8 max-w-2xl mx-auto flex flex-col h-[calc(100vh-2rem)]">
            <ChatHeader
                chatId={id!}
                title={chatMeta?.title}
                mediaTitle={chatMeta?.media_title}
                isFreeConversation={!!chatMeta && chatMeta.media_id === chatMeta.learning_id}
                isDeleting={deleteMutation.isPending}
                isRenaming={renameMutation.isPending}
                onDelete={() => deleteMutation.mutate()}
                onRename={(newTitle) => renameMutation.mutate(newTitle)}
            />
            <div className="mb-4">
                <ChatSettings
                    configs={configs}
                    onAddConfig={addConfig}
                    onRemoveConfig={removeConfig}
                    onUpdateConfig={updateConfig}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />
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
                learningLanguage={chatMeta?.learning_language ?? ''}
            />
            <ChatMessageInput isSending={isSending} onSend={sendNew} learningLanguage={chatMeta?.learning_language ?? ''}/>
        </div>
    )
}