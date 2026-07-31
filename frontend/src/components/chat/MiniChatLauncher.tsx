import {useState} from 'react'
import {MessageCircle, X} from 'lucide-react'
import MiniChat from '@/components/chat/MiniChat'

interface Props {
    mediaId: string
    instanceKey?: string
    title?: string
    getContext?: () => string
}

/**
 * Floating support-bot-style entry point for MiniChat: a circular button
 * fixed to the bottom-right corner that expands into the chat panel above
 * itself when clicked. Purely a positioning/open-state wrapper — all chat
 * behavior lives in MiniChat itself.
 */
export default function MiniChatLauncher({mediaId, instanceKey, title, getContext}: Props) {
    const [open, setOpen] = useState(false)

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {open && (
                <div className="w-80">
                    <MiniChat mediaId={mediaId} instanceKey={instanceKey} title={title} getContext={getContext}/>
                </div>
            )}
            <button
                onClick={() => setOpen(v => !v)}
                aria-label="Mini-Chat"
                className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
            >
                {open ? <X size={20}/> : <MessageCircle size={20}/>}
            </button>
        </div>
    )
}