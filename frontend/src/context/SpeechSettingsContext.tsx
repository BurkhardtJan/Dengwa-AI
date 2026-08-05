import {createContext, useContext, useState} from 'react'
import type {ReactNode} from 'react'
import type {SttEngineId, TtsEngineId} from '@/lib/speech/types'

const TTS_STORAGE_KEY = 'speech.ttsEngine'
const STT_STORAGE_KEY = 'speech.sttEngine'
const SPEAK_WHILE_STREAMING_KEY = 'speech.speakWhileStreaming'

type SpeechSettingsContextType = {
    ttsEngine: TtsEngineId
    setTtsEngine: (engine: TtsEngineId) => void
    sttEngine: SttEngineId
    setSttEngine: (engine: SttEngineId) => void
    speakWhileStreaming: boolean
    setSpeakWhileStreaming: (enabled: boolean) => void
}

const SpeechSettingsContext = createContext<SpeechSettingsContextType | null>(null)

function readStored<T extends string>(key: string, fallback: T): T {
    return (localStorage.getItem(key) as T | null) ?? fallback
}

export function SpeechSettingsProvider({children}: { children: ReactNode }) {
    const [ttsEngine, setTtsEngineState] = useState<TtsEngineId>(() => readStored(TTS_STORAGE_KEY, 'browser'))
    const [sttEngine, setSttEngineState] = useState<SttEngineId>(() => readStored(STT_STORAGE_KEY, 'browser'))
    const [speakWhileStreaming, setSpeakWhileStreamingState] = useState<boolean>(
        () => localStorage.getItem(SPEAK_WHILE_STREAMING_KEY) === 'true'
    )

    function setTtsEngine(engine: TtsEngineId) {
        localStorage.setItem(TTS_STORAGE_KEY, engine)
        setTtsEngineState(engine)
    }

    function setSttEngine(engine: SttEngineId) {
        localStorage.setItem(STT_STORAGE_KEY, engine)
        setSttEngineState(engine)
    }

    function setSpeakWhileStreaming(enabled: boolean) {
        localStorage.setItem(SPEAK_WHILE_STREAMING_KEY, String(enabled))
        setSpeakWhileStreamingState(enabled)
    }

    return (
        <SpeechSettingsContext.Provider value={{
            ttsEngine, setTtsEngine,
            sttEngine, setSttEngine,
            speakWhileStreaming, setSpeakWhileStreaming,
        }}>
            {children}
        </SpeechSettingsContext.Provider>
    )
}

export function useSpeechSettings() {
    const ctx = useContext(SpeechSettingsContext)
    if (!ctx) throw new Error('useSpeechSettings must be used within SpeechSettingsProvider')
    return ctx
}