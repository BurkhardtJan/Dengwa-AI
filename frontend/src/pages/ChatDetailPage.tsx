import {useState, useRef, useEffect} from 'react'
import {useParams, useNavigate} from 'react-router-dom'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {fetchChatHistory, sendMessage, deleteChat, fetchChats} from '@/services/chat.service.ts'
import {fetchMedium} from '@/services/media.service.ts'

export default function ChatDetailPage() {
    const {id} = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [inputMessage, setInputMessage] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const {data: history, isLoading, isError} = useQuery({
        queryKey: ['chatHistory', id],
        queryFn: () => fetchChatHistory(id!),
        enabled: !!id
    })

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

    const sendMessageMutation = useMutation({
        mutationFn: (msg: string) => sendMessage(id!, msg),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['chatHistory', id]})
            setInputMessage('')
        }
    })

    const deleteMutation = useMutation({
        mutationFn: () => deleteChat(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['chat']})
            navigate('/chat')
        }
    })

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'})
    }, [history])

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputMessage.trim() || sendMessageMutation.isPending) return
        sendMessageMutation.mutate(inputMessage.trim())
    }

    if (isLoading) return <p className="p-8">Lade Konversation...</p>
    if (isError) return <p className="p-8 text-destructive">Fehler beim Laden des Chats</p>

    return (
        <div className="p-8 max-w-2xl mx-auto flex flex-col h-[calc(100vh-2rem)]">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <button
                        onClick={() => navigate('/chat')}
                        className="text-sm text-muted-foreground hover:underline mb-4 block"
                    >
                        ← Zurück zu den Chats
                    </button>
                    <h1 className="text-3xl font-bold">
                        {media ? `Chat: ${media.title}` : 'Konversation'}
                    </h1>
                    {media && (
                        <p className="text-sm text-muted-foreground mt-1">
                            Medium: <span className="font-medium">{media.title}</span>
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground font-mono mt-1">ID: {id}</p>
                </div>

                <button
                    onClick={() => {
                        if (confirm('Möchtest du diesen Chat wirklich unwiderruflich löschen?')) {
                            deleteMutation.mutate()
                        }
                    }}
                    disabled={deleteMutation.isPending}
                    className="text-destructive border border-destructive/30 px-3 py-1.5 rounded-lg hover:bg-destructive/5 text-sm transition-colors disabled:opacity-50"
                >
                    {deleteMutation.isPending ? 'Löscht...' : 'Chat Löschen'}
                </button>
            </div>

            <div className="flex-1 border rounded-lg p-4 bg-muted/20 overflow-y-auto min-h-[350px] space-y-4 mb-4">
                {(history ?? []).length === 0 ? (
                    <p className="text-muted-foreground text-sm italic text-center mt-4">
                        Starte das Gespräch, indem du unten eine Nachricht eingibst.
                    </p>
                ) : (
                    (history ?? []).map((msg) => {
                        const isAi = msg.role === 'assistant' || msg.role === 'ai'
                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col max-w-[80%] ${
                                    isAi ? 'mr-auto items-start' : 'ml-auto items-end'
                                }`}
                            >
                                <span
                                    className="text-[10px] text-muted-foreground mb-0.5 px-1 uppercase tracking-wider">
                                    {isAi ? 'KI-Assistent' : 'Du'}
                                </span>
                                <div
                                    className={`rounded-2xl px-4 py-2.5 text-sm ${
                                        isAi
                                            ? 'bg-background border text-foreground rounded-tl-none'
                                            : 'bg-primary text-primary-foreground rounded-tr-none'
                                    }`}
                                >
                                    <p className="whitespace-pre-wrap">{msg.message}</p>
                                </div>
                                <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
    {new Date(msg.timestamp).toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
    })}
</span>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef}/>
            </div>

            <form onSubmit={handleSend} className="flex gap-2">
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Schreibe eine Nachricht in deiner Lernsprache..."
                    disabled={sendMessageMutation.isPending}
                    className="flex-1 border rounded-lg px-4 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                />
                <button
                    type="submit"
                    disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                    {sendMessageMutation.isPending ? 'Sendet...' : 'Senden'}
                </button>
            </form>
        </div>
    )
}