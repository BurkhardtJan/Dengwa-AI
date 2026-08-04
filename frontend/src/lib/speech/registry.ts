import type {SttEngine, SttEngineId, TtsEngine, TtsEngineId} from './types'
import {browserTts} from './engines/browserTts'
import {wasmTts} from "@/lib/speech/engines/wasmTts.ts";
import {browserStt} from './engines/browserStt'

function notImplementedTts(id: TtsEngineId): TtsEngine {
    return {
        id,
        isSupported: () => false,
        speak: () => Promise.reject(new Error(`TTS engine "${id}" is not implemented yet.`)),
        stop: () => {
        },
    }
}

function notImplementedStt(id: SttEngineId): SttEngine {
    return {
        id,
        isSupported: () => false,
        start: ({onError}) => onError?.(`STT engine "${id}" is not implemented yet.`),
        stop: () => {
        },
    }
}

const ttsEngines: Record<TtsEngineId, TtsEngine> = {
    browser: browserTts,
    webgpu: wasmTts,
    server: notImplementedTts('server'),
}

const sttEngines: Record<SttEngineId, SttEngine> = {
    browser: browserStt,
    webgpu: notImplementedStt('webgpu'),
    server: notImplementedStt('server'),
}

export function getTtsEngine(id: TtsEngineId): TtsEngine {
    return ttsEngines[id]
}

export function getSttEngine(id: SttEngineId): SttEngine {
    return sttEngines[id]
}