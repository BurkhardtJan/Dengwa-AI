// Runs entirely off the main thread: model download, ONNX Runtime Web
// (WASM) init, and the actual inference all happen here.
//
// Typing note: project-wide tsconfig.app.json only includes
// "lib": ["ES2023", "DOM"], not "WebWorker" - rather than adding a second
// tsconfig for this one file, the worker global scope is accessed loosely
// below; the message payloads carry the real type safety.

type TtsPipeline = (text: string) => Promise<{ audio: Float32Array; sampling_rate: number }>

interface ProgressEvent {
    status: 'initiate' | 'download' | 'progress' | 'done' | 'ready'
    file?: string
    progress?: number
    loaded?: number
    total?: number
}

type RequestMessage = { requestId: number; modelId: string; text: string }
type ResponseMessage =
    | { type: 'progress'; modelId: string; event: ProgressEvent }
    | { type: 'result'; requestId: number; audio: Float32Array; sampling_rate: number }
    | { type: 'error'; requestId: number; message: string }

interface WorkerGlobal {
    onmessage: ((e: { data: RequestMessage }) => void) | null

    postMessage(message: ResponseMessage, options?: { transfer?: Transferable[] }): void
}

// eslint-disable-next-line no-restricted-globals
const workerScope = self as unknown as WorkerGlobal

const pipelineCache = new Map<string, Promise<TtsPipeline>>()

async function getPipeline(modelId: string): Promise<TtsPipeline> {
    let cached = pipelineCache.get(modelId)
    if (!cached) {
        cached = import('@huggingface/transformers').then(({pipeline}) =>
            pipeline('text-to-speech', modelId, {
                device: 'wasm',
                dtype: 'fp32',
                progress_callback: (event: ProgressEvent) => {
                    workerScope.postMessage({type: 'progress', modelId, event})
                },
            }) as unknown as Promise<TtsPipeline>
        )
        cached.catch(() => pipelineCache.delete(modelId))
        pipelineCache.set(modelId, cached)
    }
    return cached
}

workerScope.onmessage = async (e) => {
    const {requestId, modelId, text} = e.data
    try {
        const synthesize = await getPipeline(modelId)
        const {audio, sampling_rate} = await synthesize(text)
        workerScope.postMessage(
            {type: 'result', requestId, audio, sampling_rate},
            {transfer: [audio.buffer]},
        )
    } catch (err) {
        workerScope.postMessage({
            type: 'error',
            requestId,
            message: err instanceof Error ? err.message : String(err),
        })
    }
}