import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import Modal from '../components/Modal'
import {fetchChats, createChat} from '@/services/chat.service.ts'
import {fetchMedia} from '@/services/media.service.ts'
import {useLanguage} from '@/context/TargetLanguageContext.tsx'
import type {components} from '../types/api'
import {useTranslation} from 'react-i18next'

type Chat = components['schemas']['ChatResponse']
type Media = components['schemas']['MediaResponse']

function ChatPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const {selectedLan} = useLanguage()
    const {t} = useTranslation(['chat', 'common'])

    const [showForm, setShowForm] = useState(false)
    const [selectedMediaId, setSelectedMediaId] = useState('')

    const {data: chat, isLoading: isChatsLoading, isError: isChatsError} = useQuery({
        queryKey: ['chat', selectedLan],
        queryFn: () => fetchChats(selectedLan ?? undefined)
    })

    const {data: mediaList} = useQuery({
        queryKey: ['media', selectedLan],
        queryFn: () => fetchMedia(selectedLan ?? undefined),
        enabled: !!selectedLan
    })

    const mediaMap = new Map<string, string>(
        (mediaList ?? []).map((m: Media) => [m.id, m.title])
    )

    const createChatMutation = useMutation({
        mutationFn: () => createChat(selectedMediaId),
        onSuccess: (newChat) => {
            queryClient.invalidateQueries({queryKey: ['chat']})
            setSelectedMediaId('')
            setShowForm(false)
            navigate(`/chat/${newChat.id}`)
        }
    })

    if (isChatsLoading) return <p className="p-8">{t('loading')}</p>
    if (isChatsError) return <p className="p-8 text-destructive">{t('errorLoading')}</p>

    return (
        <div className="min-h-screen p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">{t('common:nav.chats')}</h1>
                {selectedLan && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        {t('addButton')}
                    </button>
                )}
            </div>

            <div className="grid gap-4">
                {(chat ?? []).length === 0 ? (
                    <p className="text-muted-foreground text-sm italic">
                        {selectedLan
                            ? t('noChats', {language: selectedLan})
                            : t('common:noLanguageSelected')}
                    </p>
                ) : (
                    (chat ?? []).map((chat: Chat) => (
                        <div
                            key={chat.id}
                            className="border rounded-lg p-4 cursor-pointer hover:bg-muted transition-colors flex justify-between items-center"
                            onClick={() => navigate(`/chat/${chat.id}`)}
                        >
                            <div>
                                <p className="font-medium">
                                    {mediaMap.get(chat.media_id)
                                        ? `${t('title')}: ${mediaMap.get(chat.media_id)}`
                                        : t('conversation')}
                                </p>
                                {mediaMap.get(chat.media_id) && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {t('medium')}: {mediaMap.get(chat.media_id)}
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground font-mono mt-1">ID: {chat.id}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showForm && (
                <Modal onClose={() => setShowForm(false)}>
                    <h2 className="text-lg font-bold mb-4">{t('newChat')}</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        {t('selectMediaLabel', {language: selectedLan})}
                    </p>
                    <div className="flex flex-col gap-4">
                        <select
                            value={selectedMediaId}
                            onChange={e => setSelectedMediaId(e.target.value)}
                            className="border rounded-lg px-3 py-2 bg-background text-sm"
                        >
                            <option value="">{t('selectMediaPlaceholder')}</option>
                            {(mediaList ?? []).map((media: Media) => (
                                <option key={media.id} value={media.id}>
                                    {media.title}
                                </option>
                            ))}
                        </select>
                        <div className="flex gap-2 justify-end mt-2">
                            <button
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 border rounded-lg text-sm hover:bg-muted"
                            >
                                {t('common:buttons.cancel')}
                            </button>
                            <button
                                onClick={() => createChatMutation.mutate()}
                                disabled={!selectedMediaId || createChatMutation.isPending}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50"
                            >
                                {createChatMutation.isPending ? t('starting') : t('startButton')}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}

export default ChatPage