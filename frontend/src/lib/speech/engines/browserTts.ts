import type {TtsEngine} from '../types'

/**
 * Text-to-speech via the browser's built-in SpeechSynthesis API.
 * Zero setup and fully offline, but voice quality/language coverage
 * varies a lot by platform — on Linux/Chrome it typically falls back
 * to espeak-ng, which has thin non-English voice coverage.
 */
export const browserTts: TtsEngine = {
    id: 'browser',

    isSupported() {
        return typeof window !== 'undefined' && 'speechSynthesis' in window
    },

    speak(text: string, lang: string) {
        return new Promise((resolve, reject) => {
            if (!browserTts.isSupported()) {
                reject(new Error('SpeechSynthesis is not supported in this browser.'))
                return
            }

            window.speechSynthesis.cancel() // stop anything currently speaking

            const utterance = new SpeechSynthesisUtterance(text)
            utterance.lang = lang
            utterance.onend = () => resolve()
            utterance.onerror = (event) => reject(new Error(`SpeechSynthesis error: ${event.error}`))

            window.speechSynthesis.speak(utterance)
        })
    },

    stop() {
        if (browserTts.isSupported()) {
            window.speechSynthesis.cancel()
        }
    },
}