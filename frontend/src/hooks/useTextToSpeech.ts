import {useCallback, useState} from 'react'
import {getTtsEngine} from '@/lib/speech/registry'
import {useSpeechSettings} from '@/context/SpeechSettingsContext'
import type {TtsStatus} from '@/lib/speech/types'

export function useTextToSpeech() {
    const {ttsEngine} = useSpeechSettings()
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [status, setStatus] = useState<TtsStatus | null>(null)
    const engine = getTtsEngine(ttsEngine)

    const speak = useCallback(async (text: string, lang: string) => {
        setIsSpeaking(true)
        try {
            await engine.speak(text, lang, setStatus)
        } finally {
            setIsSpeaking(false)
            setStatus(null)
        }
    }, [engine])

    const stop = useCallback(() => {
        engine.stop()
        setIsSpeaking(false)
        setStatus(null)
    }, [engine])

    return {speak, stop, isSpeaking, status, isSupported: engine.isSupported()}
}