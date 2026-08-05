import type {TtsEngine} from './types'
import {stripMarkdownForSpeech} from './stripMarkdownForSpeech'

// Punctuation that ends a sentence, followed by whitespace - used to carve
// speakable chunks out of the incoming stream without waiting for the
// whole reply to finish. Deliberately simple (no abbreviation handling);
// worst case a sentence gets split one word later than ideal, which is a
// much smaller problem than not streaming at all.
const SENTENCE_END = /[.!?]["')\]]?\s+/

/**
 * Buffers streamed text and speaks it sentence-by-sentence as complete
 * sentences arrive, queued so playback stays in order even though a given
 * engine's speak() may resolve at a different pace than new chunks arrive.
 * Works with any TtsEngine - browser TTS included, even though its
 * speak() cancels any in-progress utterance, because we never start
 * sentence N+1 until sentence N's speak() promise has resolved.
 */
export function createStreamingSpeaker(
    engine: TtsEngine,
    lang: string,
    onSpeakingChange?: (speaking: boolean) => void,
) {
    let buffer = ''
    let queue: Promise<void> = Promise.resolve()
    let stopped = false
    let pending = 0 // sentences queued or currently playing - keeps "is it still talking" accurate even after the text stream itself has finished

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
            return engine.speak(spoken, lang)
                .catch((err) => {
                    // One bad sentence (e.g. a model load failure) shouldn't
                    // silently kill the rest of the queue.
                    console.warn('[streamingSpeaker] speak failed:', err)
                })
                .finally(() => setPending(-1))
        })
    }

    return {
        /** Feed the next chunk of streamed text; speaks any complete sentence(s) it now contains. */
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
        /** Call once the stream itself is done - speaks whatever's left in the buffer (e.g. a final sentence with no trailing punctuation). */
        flush() {
            if (stopped) return
            if (buffer.trim()) enqueue(buffer)
            buffer = ''
        },
        /** Cancels the rest of the queue and stops whatever's currently playing. Does NOT get called just because streaming finished - only for actual cancellation (new message starts, feature gets disabled, component unmounts, or the user hits stop). */
        stop() {
            stopped = true
            engine.stop()
            if (pending > 0) setPending(-pending)
        },
    }
}