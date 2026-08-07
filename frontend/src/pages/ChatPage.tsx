import {useMemo} from 'react'
import {useNavigate} from 'react-router-dom'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {fetchChats, createChat} from '@/services/chat.service.ts'
import {fetchLanguages} from '@/services/language.service.ts'
import {useLanguage} from '@/context/TargetLanguageContext.tsx'
import {useMedium} from '@/context/MediumContext'
import type {components} from '../types/api'
import {getLanguageDisplayName} from '@/lib/languages'
import {PAGE_WIDTH, PAGE_PADDING} from '@/lib/layout'
import {useTranslation} from 'react-i18next'

type Chat = components['schemas']['ChatResponse']

function ChatPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const {selectedLan} = useLanguage()
    const {mediumId, medium} = useMedium()
    const {t, i18n} = useTranslation(['chat', 'common'])

    const {data: chat, isLoading: isChatsLoading, isError: isChatsError} = useQuery({
        queryKey: ['chat', selectedLan],
        queryFn: () => fetchChats(selectedLan ?? undefined)
    })

    // Reuses the same ['languages'] cache Sidebar.tsx already populates —
    // we only need it here for the current language's id (== its dummy
    // medium's id, see get_or_create_learning on the backend), to start a
    // chat with no real medium attached.
    const {data: languages} = useQuery({
        queryKey: ['languages'],
        queryFn: fetchLanguages
    })
    const currentLearning = languages?.find(l => l.learning_language === selectedLan)

    const createChatMutation = useMutation({
        mutationFn: ({mediaId, title}: { mediaId: string; title?: string }) => createChat(mediaId, title),
        onSuccess: (newChat) => {
            queryClient.invalidateQueries({queryKey: ['chat']})
            navigate(`/chat/${newChat.id}`)
        }
    })

    const visibleChats = useMemo(
        () => mediumId ? (chat ?? []).filter((c: Chat) => c.media_id === mediumId) : (chat ?? []),
        [chat, mediumId]
    )

    function handleAddChat() {
        if (mediumId) {
            createChatMutation.mutate({mediaId: mediumId})
        } else if (currentLearning) {
            // No medium selected/filtered → free-form conversation practice,
            // backed by the per-language dummy medium (id === learning_id).
            // Sending the title up front avoids a "Chat: es" flash before
            // the background auto-title job would otherwise overwrite it.
            createChatMutation.mutate({mediaId: currentLearning.id, title: t('freeConversation')})
        }
    }

    if (isChatsLoading) return <p className="p-8">{t('loading')}</p>
    if (isChatsError) return <p className="p-8 text-destructive">{t('errorLoading')}</p>

    return (
        <div className={`min-h-screen ${PAGE_PADDING} ${PAGE_WIDTH}`}>
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
                    (visibleChats ?? []).map((chat: Chat) => {
                        const isFreeConversation = chat.media_id === chat.learning_id
                        return (
                            <div
                                key={chat.id}
                                className="border rounded-lg p-4 cursor-pointer hover:bg-muted transition-colors flex justify-between items-center"
                                onClick={() => navigate(`/chat/${chat.id}`)}
                            >
                                <div>
                                    <p className="font-medium">{chat.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {isFreeConversation ? t('freeConversation') : `${t('medium')}: ${chat.media_title}`}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

export default ChatPage