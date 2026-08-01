import {useCallback, useState} from 'react'
import {getSttEngine} from '@/lib/speech/registry'
import {useSpeechSettings} from '@/context/SpeechSettingsContext'

export function useSpeechToText() {
    const {sttEngine} = useSpeechSettings()
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const engine = getSttEngine(sttEngine)

    const start = useCallback((lang: string) => {
        setTranscript('')
        setIsListening(true)
        engine.start({
            lang,
            onResult: (text, isFinal) => {
                setTranscript(text)
                if (isFinal) setIsListening(false)
            },
            onError: () => setIsListening(false),
        })
    }, [engine])

    const stop = useCallback(() => {
        engine.stop()
        setIsListening(false)
    }, [engine])

    return {start, stop, isListening, transcript, isSupported: engine.isSupported()}
}