export type TtsEngineId = 'browser' | 'webgpu' | 'server'
export type SttEngineId = 'browser' | 'webgpu' | 'server'

export interface TtsStatus {
    label: string
    progress?: number
}

export interface TtsEngine {
    id: TtsEngineId

    isSupported(): boolean

    speak(text: string, lang: string, onStatus?: (status: TtsStatus | null) => void): Promise<void>

    stop(): void
}

export interface SttStartOptions {
    lang: string
    onResult: (transcript: string, isFinal: boolean) => void
    onError?: (message: string) => void
}

export interface SttEngine {
    id: SttEngineId

    isSupported(): boolean

    start(options: SttStartOptions): void

    stop(): void
}