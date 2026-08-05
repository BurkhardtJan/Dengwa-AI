import type {TtsEngine} from './types'
import {stripMarkdownForSpeech} from './stripMarkdownForSpeech'

const SENTENCE_END = /[.!?]["')\]]?\s+/

export function createStreamingSpeaker(engine: TtsEngine, lang: string) {
    let buffer = ''
    let queue: Promise<void> = Promise.resolve()
    let stopped = false

    function enqueue(rawSentence: string) {
        const spoken = stripMarkdownForSpeech(rawSentence)
        if (!spoken.trim()) return
        queue = queue.then(() => {
            if (stopped) return
            return engine.speak(spoken, lang).catch((err) => {
                console.warn('[streamingSpeaker] speak failed:', err)
            })
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
        },
    }
}