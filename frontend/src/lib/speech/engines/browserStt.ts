import type {SttEngine, SttStartOptions} from '../types'

function getSpeechRecognitionConstructor(): (new () => SpeechRecognition) | undefined {
    if (typeof window === 'undefined') return undefined
    return window.SpeechRecognition ?? window.webkitSpeechRecognition
}

let activeRecognition: SpeechRecognition | null = null

/**
 * Speech-to-text via the browser's native SpeechRecognition API.
 *
 * NOTE: in Chrome/Chromium this streams the recorded audio to Google's
 * servers for transcription — it is NOT local and NOT open source.
 * Kept as a zero-setup fallback; the "webgpu" (local Whisper) and
 * "server" (self-hosted) engines are the privacy-respecting choices.
 */
export const browserStt: SttEngine = {
    id: 'browser',

    isSupported() {
        return getSpeechRecognitionConstructor() !== undefined
    },

    start({lang, onResult, onError}: SttStartOptions) {
        const RecognitionCtor = getSpeechRecognitionConstructor()
        if (!RecognitionCtor) {
            onError?.('SpeechRecognition is not supported in this browser.')
            return
        }

        activeRecognition?.abort()

        const recognition = new RecognitionCtor()
        recognition.lang = lang
        recognition.continuous = true
        recognition.interimResults = true

        recognition.onresult = (event) => {
            const result = event.results[event.results.length - 1]
            onResult(result[0].transcript, result.isFinal)
        }
        recognition.onerror = (event) => {
            onError?.(event.error)
        }

        activeRecognition = recognition
        recognition.start()
    },

    stop() {
        activeRecognition?.stop()
        activeRecognition = null
    },
}