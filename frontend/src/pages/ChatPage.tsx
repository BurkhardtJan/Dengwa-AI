import {useState, useMemo} from 'react'
import {useNavigate} from 'react-router-dom'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import Modal from '../components/Modal'
import {fetchChats, createChat} from '@/services/chat.service.ts'
import {fetchMedia} from '@/services/media.service.ts'
import {useLanguage} from '@/context/TargetLanguageContext.tsx'
import {useMedium} from '@/context/MediumContext'
import type {components} from '../types/api'
import {getLanguageDisplayName} from '@/lib/languages'
import {useTranslation} from 'react-i18next'

type Chat = components['schemas']['ChatResponse']
type Media = components['schemas']['MediaResponse']

function ChatPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const {selectedLan} = useLanguage()
    const {mediumId, medium} = useMedium()
    const {t, i18n} = useTranslation(['chat', 'common'])
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


    const createChatMutation = useMutation({
        mutationFn: (mediaId: string) => createChat(mediaId),
        onSuccess: (newChat) => {
            queryClient.invalidateQueries({queryKey: ['chat']})
            setSelectedMediaId('')
            setShowForm(false)
            navigate(`/chat/${newChat.id}`)
        }
    })

    const visibleChats = useMemo(
        () => mediumId ? (chat ?? []).filter((c: Chat) => c.media_id === mediumId) : (chat ?? []),
        [chat, mediumId]
    )


    function handleAddChat() {
        if (mediumId) {
            createChatMutation.mutate(mediumId)
        } else {
            setShowForm(true)
        }
    }

    if (isChatsLoading) return <p className="p-8">{t('loading')}</p>
    if (isChatsError) return <p className="p-8 text-destructive">{t('errorLoading')}</p>

    return (
        <div className="min-h-screen p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">{t('common:nav.chats')}</h1>
                {selectedLan && (
                    <button
                        onClick={handleAddChat}
                        disabled={createChatMutation.isPending}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {createChatMutation.isPending ? t('starting') : t('addButton')}
                    </button>
                )}
            </div>

            <div className="grid gap-4">
                {(visibleChats ?? []).length === 0 ? (
                    <p className="text-muted-foreground text-sm italic">
                        {mediumId
                            ? t('noChatsForMedium', {medium: medium?.title})
                            : selectedLan
                                ? t('noChats', {language: getLanguageDisplayName(selectedLan, i18n.language)})
                                : t('common:noLanguageSelected')}
                    </p>
                ) : (
                    (visibleChats ?? []).map((chat: Chat) => (
                        <div
                            key={chat.id}
                            className="border rounded-lg p-4 cursor-pointer hover:bg-muted transition-colors flex justify-between items-center"
                            onClick={() => navigate(`/chat/${chat.id}`)}
                        >
                            <div>
                                <p className="font-medium">{chat.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {t('medium')}: {chat.media_title}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showForm && (
                <Modal onClose={() => setShowForm(false)}>
                    <h2 className="text-lg font-bold mb-4">{t('newChat')}</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        {t('selectMediaLabel', {language: selectedLan ? getLanguageDisplayName(selectedLan, i18n.language) : selectedLan})}                    </p>
                    <select
                        value={selectedMediaId}
                        onChange={e => setSelectedMediaId(e.target.value)}
                        className="border rounded-lg px-3 py-2 bg-background text-sm"
                    >
                        <option value="">{t('selectMediaPlaceholder')}</option>
                        {(mediaList ?? []).map((media: Media) => (
                            <option key={media.id} value={media.id}>{media.title}</option>
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
                            onClick={() => createChatMutation.mutate(selectedMediaId)}
                            disabled={!selectedMediaId || createChatMutation.isPending}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50"
                        >
                            {createChatMutation.isPending ? t('starting') : t('startButton')}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    )
}

export default ChatPage