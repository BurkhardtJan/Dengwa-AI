import type {TtsEngine, TtsStatus} from './types'
import {stripMarkdownForSpeech} from './stripMarkdownForSpeech'

// Punctuation that ends a sentence, followed by whitespace - used to carve
// speakable chunks out of the incoming stream without waiting for the
// whole reply to finish. The char class after the punctuation also covers
// markdown emphasis/quote/bracket characters that can sit between the
// punctuation and the next space (e.g. "wichtig.**" for bold, "gut.\"")
// so a sentence ending right at a markdown boundary still gets detected -
// stripMarkdownForSpeech() only runs per already-cut sentence in enqueue(),
// so the raw markdown is still in the buffer when this regex runs.
// Deliberately simple otherwise (no abbreviation handling); worst case a
// sentence gets split one word later than ideal, which is a much smaller
// problem than not streaming at all.
const SENTENCE_END = /[.!?][*_~"')\]]*\s+/

/**
 * Buffers text and speaks it sentence-by-sentence, queued so playback
 * stays in order even though a given engine's speak() may resolve at a
 * different pace than sentences are pushed in. Works with any TtsEngine -
 * browser TTS included, even though its speak() cancels any in-progress
 * utterance, because we never start sentence N+1 until sentence N's
 * speak() promise has resolved.
 *
 * Used both for genuinely streamed text (push() called repeatedly as
 * chunks arrive from an SSE response) and for a single already-complete
 * text (one push() + immediate flush()) - splitting a full message into
 * sentences before speaking it isn't just for streaming, it also sounds
 * better than handing a whole paragraph to one engine call (cleaner
 * per-sentence pauses/prosody) and sidesteps engine-specific limits on
 * very long single utterances (e.g. Chrome's SpeechSynthesis bug on very
 * long text).
 */
export function createStreamingSpeaker(
    engine: TtsEngine,
    lang: string,
    onSpeakingChange?: (speaking: boolean) => void,
    onStatus?: (status: TtsStatus | null) => void,
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
            return engine.speak(spoken, lang, onStatus)
                .catch((err) => {
                    // One bad sentence (e.g. a model load failure) shouldn't
                    // silently kill the rest of the queue.
                    console.warn('[streamingSpeaker] speak failed:', err)
                })
                .finally(() => setPending(-1))
        })
    }

    return {
        /** Feed the next chunk of streamed text; speaks any complete sentence(s) it now contains. For a non-streamed text, just call this once with the whole string, then flush(). */
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
        /** Call once there's no more text coming - speaks whatever's left in the buffer (e.g. a final sentence with no trailing punctuation). */
        flush() {
            if (stopped) return
            if (buffer.trim()) enqueue(buffer)
            buffer = ''
        },
        /** Cancels the rest of the queue and stops whatever's currently playing. Does NOT get called just because the text ran out - only for actual cancellation (new message starts, feature gets disabled, component unmounts, or the user hits stop). */
        stop() {
            stopped = true
            engine.stop()
            if (pending > 0) setPending(-pending)
        },
    }
}