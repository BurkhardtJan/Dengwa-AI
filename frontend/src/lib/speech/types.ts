export type TtsEngineId = 'browser' | 'webgpu' | 'server'
export type SttEngineId = 'browser' | 'webgpu' | 'server'

export interface TtsEngine {
    id: TtsEngineId

    /** Whether this engine can run at all in the current browser/environment. */
    isSupported(): boolean

    /** Speaks the given text aloud. Resolves once playback finishes (or is stopped). */
    speak(text: string, lang: string): Promise<void>

    /** Stops any speech currently in progress from this engine. */
    stop(): void
}

export interface SttStartOptions {
    lang: string
    /** Called with the current transcript. isFinal marks the recognizer's final result for that segment. */
    onResult: (transcript: string, isFinal: boolean) => void
    onError?: (message: string) => void
}

export interface SttEngine {
    id: SttEngineId

    /** Whether this engine can run at all in the current browser/environment. */
    isSupported(): boolean

    /** Starts listening. Results arrive via onResult as they become available. */
    start(options: SttStartOptions): void

    /** Stops listening. */
    stop(): void
}