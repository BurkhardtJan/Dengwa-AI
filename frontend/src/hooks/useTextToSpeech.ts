import {useCallback, useState} from 'react'
import {getTtsEngine} from '@/lib/speech/registry'
import {useSpeechSettings} from '@/context/SpeechSettingsContext'

export function useTextToSpeech() {
    const {ttsEngine} = useSpeechSettings()
    const [isSpeaking, setIsSpeaking] = useState(false)
    const engine = getTtsEngine(ttsEngine)

    const speak = useCallback(async (text: string, lang: string) => {
        setIsSpeaking(true)
        try {
            await engine.speak(text, lang)
        } finally {
            setIsSpeaking(false)
        }
    }, [engine])

    const stop = useCallback(() => {
        engine.stop()
        setIsSpeaking(false)
    }, [engine])

    return {speak, stop, isSpeaking, isSupported: engine.isSupported()}
}