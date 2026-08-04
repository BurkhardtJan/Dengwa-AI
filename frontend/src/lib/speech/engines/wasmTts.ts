import langs from 'langs'
import type {TtsEngine, TtsStatus} from '../types'

const MMS_OVERRIDES: Record<string, string> = {
    zh: 'cmn',
    ms: 'zlm',
}

function buildMmsModelId(bcp47OrIso1: string): string {
    const primary = bcp47OrIso1.split('-')[0].toLowerCase()
    const code = MMS_OVERRIDES[primary] ?? langs.where('1', primary)?.['3'] ?? primary
    return `Xenova/mms-tts-${code}`
}

interface ProgressEvent {
    status: 'initiate' | 'download' | 'progress' | 'done' | 'ready'
    file?: string
    progress?: number
    loaded?: number
    total?: number
}

type ResponseMessage =
    | { type: 'progress'; modelId: string; event: ProgressEvent }
    | { type: 'result'; requestId: number; audio: Float32Array; sampling_rate: number }
    | { type: 'error'; requestId: number; message: string }

function formatProgress(event: ProgressEvent): TtsStatus | null {
    switch (event.status) {
        case 'initiate':
            return {label: `Loading TTS model (${event.file ?? '…'})`}
        case 'progress': {
            const fraction = event.total ? (event.loaded ?? 0) / event.total : (event.progress ?? 0) / 100
            return {label: `Downloading model… ${Math.round(fraction * 100)}%`, progress: fraction}
        }
        case 'done':
            return {label: 'Compiling model…'}
        default:
            return null
    }
}

let worker: Worker | null = null
let workerWired = false

function getWorker(): Worker {
    if (!worker) {
        worker = new Worker(new URL('./wasmTts.worker.ts', import.meta.url), {type: 'module'})
    }
    return worker
}

let nextRequestId = 0
const pendingRequests = new Map<number, {
    resolve: (r: { audio: Float32Array; sampling_rate: number }) => void;
    reject: (err: Error) => void
}>()
const modelLoadListeners = new Map<string, Set<(status: TtsStatus | null) => void>>()

function ensureWorkerWired() {
    if (workerWired) return
    workerWired = true

    getWorker().onmessage = (e: MessageEvent<ResponseMessage>) => {
        const msg = e.data
        if (msg.type === 'progress') {
            const status = formatProgress(msg.event)
            for (const listener of modelLoadListeners.get(msg.modelId) ?? []) listener(status)
        } else if (msg.type === 'result') {
            pendingRequests.get(msg.requestId)?.resolve({audio: msg.audio, sampling_rate: msg.sampling_rate})
            pendingRequests.delete(msg.requestId)
        } else if (msg.type === 'error') {
            pendingRequests.get(msg.requestId)?.reject(new Error(msg.message))
            pendingRequests.delete(msg.requestId)
        }
    }
}

function synthesizeInWorker(
    modelId: string,
    text: string,
    onStatus?: (status: TtsStatus | null) => void,
): Promise<{ audio: Float32Array; sampling_rate: number }> {
    ensureWorkerWired()

    if (onStatus) {
        let listeners = modelLoadListeners.get(modelId)
        if (!listeners) {
            listeners = new Set()
            modelLoadListeners.set(modelId, listeners)
        }
        listeners.add(onStatus)
    }

    const requestId = nextRequestId++
    const promise = new Promise<{ audio: Float32Array; sampling_rate: number }>((resolve, reject) => {
        pendingRequests.set(requestId, {resolve, reject})
    })

    getWorker().postMessage({requestId, modelId, text})

    promise.finally(() => {
        const listeners = modelLoadListeners.get(modelId)
        if (listeners && onStatus) {
            listeners.delete(onStatus)
            if (listeners.size === 0) modelLoadListeners.delete(modelId)
        }
    })

    return promise
}

function floatPcmToAudioBuffer(ctx: AudioContext, audio: Float32Array, samplingRate: number): AudioBuffer {
    const buffer = ctx.createBuffer(1, audio.length, samplingRate)
    buffer.copyToChannel(audio, 0)
    return buffer
}

let audioCtx: AudioContext | null = null
let currentSource: AudioBufferSourceNode | null = null

function getAudioContext(): AudioContext {
    if (!audioCtx) audioCtx = new AudioContext()
    return audioCtx
}

export const wasmTts: TtsEngine = {
    id: 'webgpu',

    isSupported() {
        return typeof window !== 'undefined' && typeof Worker !== 'undefined' && typeof WebAssembly !== 'undefined'
    },

    async speak(text: string, lang: string, onStatus?: (status: TtsStatus | null) => void) {
        if (!wasmTts.isSupported()) {
            throw new Error('Web Workers or WebAssembly are not supported in this browser.')
        }

        const modelId = buildMmsModelId(lang)

        let audio: Float32Array
        let sampling_rate: number
        try {
            ;({audio, sampling_rate} = await synthesizeInWorker(modelId, text, onStatus))
        } catch (err) {
            onStatus?.(null)
            throw new Error(`TTS synthesis failed for "${modelId}": ${err instanceof Error ? err.message : err}`)
        }
        onStatus?.(null)

        const ctx = getAudioContext()
        if (ctx.state === 'suspended') await ctx.resume()

        wasmTts.stop()

        const buffer = floatPcmToAudioBuffer(ctx, audio, sampling_rate)
        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.connect(ctx.destination)
        currentSource = source

        await new Promise<void>((resolve, reject) => {
            source.onended = () => {
                if (currentSource === source) currentSource = null
                resolve()
            }
            try {
                source.start()
            } catch (err) {
                reject(err instanceof Error ? err : new Error(String(err)))
            }
        })
    },

    stop() {
        if (currentSource) {
            try {
                currentSource.stop()
            } catch {
                // already stopped/ended
            }
            currentSource = null
        }
    },
}