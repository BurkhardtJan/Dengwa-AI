export type TtsEngineId = 'browser' | 'webgpu' | 'server'
export type SttEngineId = 'browser' | 'webgpu' | 'server'

export interface TtsStatus {
    /** Short human-readable label, e.g. "Downloading model… 42%" - already formatted by the engine. */
    label: string
    /** 0-1 when known (e.g. model download); omitted for indeterminate phases like compiling. */
    progress?: number
}

export interface TtsEngine {
    id: TtsEngineId

    /** Whether this engine can run at all in the current browser/environment. */
    isSupported(): boolean

    /**
     * Speaks the given text aloud. Resolves once playback finishes (or is
     * stopped). Engines with slow first-use setup (model download/compile)
     * can report progress through onStatus, scoped to this one call - pass
     * null once idle again (loaded, or this call is done/errored). Engines
     * with no setup phase (e.g. browser TTS) simply never call it.
     */
    speak(text: string, lang: string, onStatus?: (status: TtsStatus | null) => void): Promise<void>

    /** Stops any speech currently in progress from this engine. */
    stop(): void
}

export interface SttStartOptions {
    lang: string
    /** Called with the current transcript. isFinal marks the recognizer's final result for that segment - NOT the same as the mic having stopped (continuous mode keeps listening past a final result). */
    onResult: (transcript: string, isFinal: boolean) => void
    onError?: (message: string) => void
    /** Called when the engine has actually stopped listening (mic released) - the only reliable signal for that, since it can happen from our own stop() call or from the engine itself (e.g. a silence timeout). */
    onEnd?: () => void
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