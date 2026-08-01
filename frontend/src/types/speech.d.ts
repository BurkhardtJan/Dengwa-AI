// Minimal ambient types for the Web Speech API (SpeechRecognition).
// Not part of TypeScript's lib.dom.d.ts since it's a non-standard/
// experimental API — just enough surface for lib/speech/engines/browserStt.ts.

interface SpeechRecognitionResult {
    readonly isFinal: boolean
    readonly length: number

    [index: number]: { transcript: string; confidence: number }
}

interface SpeechRecognitionResultList {
    readonly length: number

    [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number
    readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string
    readonly message: string
}

interface SpeechRecognition extends EventTarget {
    lang: string
    continuous: boolean
    interimResults: boolean

    start(): void

    stop(): void

    abort(): void

    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
    onend: (() => void) | null
}

interface Window {
    SpeechRecognition?: new () => SpeechRecognition
    webkitSpeechRecognition?: new () => SpeechRecognition
}