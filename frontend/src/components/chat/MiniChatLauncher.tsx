import {useCallback, useEffect, useRef, useState} from 'react'
import {MessageCircle, X} from 'lucide-react'
import MiniChat from '@/components/chat/MiniChat'

interface Props {
    mediaId: string
    instanceKey?: string
    title?: string
    getContext?: () => string
}

const DEFAULT_SIZE = {width: 320, height: 420}
const MIN_SIZE = {width: 280, height: 360}

/** Keeps a size within MIN_SIZE and the current viewport bounds. */
function clampSize(width: number, height: number) {
    const maxWidth = window.innerWidth - 24
    const maxHeight = window.innerHeight - 96
    return {
        width: Math.min(maxWidth, Math.max(MIN_SIZE.width, width)),
        height: Math.min(maxHeight, Math.max(MIN_SIZE.height, height)),
    }
}

/**
 * Floating support-bot-style entry point for MiniChat: a circular button
 * fixed to the bottom-right corner that expands into the chat panel above
 * itself when clicked. Purely a positioning/open-state wrapper — all chat
 * behavior lives in MiniChat itself.
 */
export default function MiniChatLauncher({mediaId, instanceKey, title, getContext}: Props) {
    const [open, setOpen] = useState(false)
    const [size, setSize] = useState(DEFAULT_SIZE)
    const dragState = useRef<{ startX: number, startY: number, startWidth: number, startHeight: number } | null>(null)

    // Panel is anchored bottom-right, so growing it means expanding
    // upward/leftward — the resize handle sits at the top-left corner and
    // dragging it further up-left increases width/height.
    const handlePointerMove = useCallback((e: PointerEvent) => {
        const drag = dragState.current
        if (!drag) return
        setSize(clampSize(
            drag.startWidth + (drag.startX - e.clientX),
            drag.startHeight + (drag.startY - e.clientY),
        ))
    }, [])

    const handlePointerUp = useCallback(() => {
        dragState.current = null
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
    }, [handlePointerMove])

    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault()
        dragState.current = {startX: e.clientX, startY: e.clientY, startWidth: size.width, startHeight: size.height}
        window.addEventListener('pointermove', handlePointerMove)
        window.addEventListener('pointerup', handlePointerUp)
    }

    // Safety net in case the component unmounts mid-drag.
    useEffect(() => () => {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
    }, [handlePointerMove, handlePointerUp])

    // Re-clamp whenever the window itself shrinks (or grows) — otherwise a
    // panel sized against a large window stays oversized and gets pushed
    // off-screen once the window is made smaller.
    useEffect(() => {
        if (!open) return
        const onResize = () => setSize(prev => clampSize(prev.width, prev.height))
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [open])

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {open && (
                <div className="relative" style={{width: size.width, height: size.height}}>
                    <div
                        onPointerDown={handlePointerDown}
                        className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-border cursor-nwse-resize touch-none z-10 hover:bg-muted-foreground/40 transition-colors"
                        aria-hidden="true"
                    />
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