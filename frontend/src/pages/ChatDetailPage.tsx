import {useParams, useNavigate} from 'react-router-dom'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {deleteChat, fetchChats} from '@/services/chat.service.ts'
import {fetchMedium} from '@/services/media.service.ts'
import {useChatTree} from '@/hooks/useChatTree'
import ChatHeader from '@/components/chat/ChatHeader'
import ChatSettings from '@/components/chat/ChatSettings'
import ChatMessageList from '@/components/chat/ChatMessageList'
import ChatMessageInput from '@/components/chat/ChatMessageInput'
import {useTranslation} from 'react-i18next'

export default function ChatDetailPage() {
    const {id} = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const {t} = useTranslation('chat')

    const {
        activePath, isLoading, isError, isSending, isRegenerating,
        switchSibling, getSiblingInfo, getSiblingMessages, sendNew, sendEdit, regenerate,
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

    const {data: media} = useQuery({
        queryKey: ['media', chatMeta?.media_id],
        queryFn: () => fetchMedium(chatMeta!.media_id),
        enabled: !!chatMeta?.media_id
    })

    const deleteMutation = useMutation({
        mutationFn: () => deleteChat(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['chat']})
            navigate('/chat')
        }
    })

    if (isLoading) return <p className="p-8">{t('loading')}</p>
    if (isError) return <p className="p-8 text-destructive">{t('errorLoading')}</p>

    return (
        <div className="p-8 max-w-2xl mx-auto flex flex-col h-[calc(100vh-2rem)]">
            <ChatHeader
                chatId={id!}
                media={media}
                isDeleting={deleteMutation.isPending}
                onDelete={() => deleteMutation.mutate()}
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
                messages={activePath}
                isSending={isSending}
                isRegenerating={isRegenerating}
                viewMode={viewMode}
                getSiblingInfo={getSiblingInfo}
                getSiblingMessages={getSiblingMessages}
                onSwitchSibling={switchSibling}
                onEditSubmit={(_id, newText, originalParentId) => sendEdit(newText, originalParentId)}
                onRegenerate={regenerate}
            />
            <ChatMessageInput isSending={isSending} onSend={sendNew}/>
        </div>
    )
}