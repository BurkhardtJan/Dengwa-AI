import {useCallback, useRef, useState} from 'react'
import {getTtsEngine} from '@/lib/speech/registry'
import {useSpeechSettings} from '@/context/SpeechSettingsContext'
import {createStreamingSpeaker} from '@/lib/speech/streamingSpeaker'
import type {TtsStatus} from '@/lib/speech/types'

export function useTextToSpeech() {
    const {ttsEngine} = useSpeechSettings()
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [status, setStatus] = useState<TtsStatus | null>(null)
    const engine = getTtsEngine(ttsEngine)
    const speakerRef = useRef<ReturnType<typeof createStreamingSpeaker> | null>(null)

    const speak = useCallback((text: string, lang: string) => {
        speakerRef.current?.stop()
        const speaker = createStreamingSpeaker(engine, lang, setIsSpeaking, setStatus)
        speakerRef.current = speaker
        speaker.push(text)
        speaker.flush()
    }, [engine])

    const stop = useCallback(() => {
        speakerRef.current?.stop()
        setIsSpeaking(false)
        setStatus(null)
    }, [])

    return {speak, stop, isSpeaking, status, isSupported: engine.isSupported()}
}