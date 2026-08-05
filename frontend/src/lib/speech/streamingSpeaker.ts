import type {TtsEngine, TtsStatus} from './types'
import {stripMarkdownForSpeech} from './stripMarkdownForSpeech'

const SENTENCE_END = /[.!?]["')\]]?\s+/

export function createStreamingSpeaker(
    engine: TtsEngine,
    lang: string,
    onSpeakingChange?: (speaking: boolean) => void,
    onStatus?: (status: TtsStatus | null) => void,
) {
    let buffer = ''
    let queue: Promise<void> = Promise.resolve()
    let stopped = false
    let pending = 0

    function setPending(delta: number) {
        const was = pending > 0
        pending += delta
        const now = pending > 0
        if (was !== now) onSpeakingChange?.(now)
    }

    function enqueue(rawSentence: string) {
        const spoken = stripMarkdownForSpeech(rawSentence)
        if (!spoken.trim()) return
        setPending(1)
        queue = queue.then(() => {
            if (stopped) {
                setPending(-1)
                return
            }
            return engine.speak(spoken, lang, onStatus)
                .catch((err) => {
                    console.warn('[streamingSpeaker] speak failed:', err)
                })
                .finally(() => setPending(-1))
        })
    }

    return {
        push(chunk: string) {
            if (stopped) return
            buffer += chunk
            let match: RegExpMatchArray | null
            while ((match = buffer.match(SENTENCE_END))) {
                const end = (match.index ?? 0) + match[0].length
                enqueue(buffer.slice(0, end))
                buffer = buffer.slice(end)
            }
        },
        flush() {
            if (stopped) return
            if (buffer.trim()) enqueue(buffer)
            buffer = ''
        },
        stop() {
            stopped = true
            engine.stop()
            if (pending > 0) setPending(-pending)
        },
    }
}