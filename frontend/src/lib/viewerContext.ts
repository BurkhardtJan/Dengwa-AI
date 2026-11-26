import type {MiniMediEvent} from 'minimedi'

/** How many of the most recent subtitle cues are kept. */
const MAX_RECENT_LINES = 6
const MAX_SELECTION_LENGTH = 2000
const MAX_LINE_LENGTH = 300

type Position = { page?: number, time?: number, chapter?: number, progress?: number }

/** Texts and number formatting for the context, supplied by the caller (i18n). */
export interface ViewerContextLabels {
    position: string
    selection: string
    recentLines: string
    page: (page: number, total?: number) => string
    time: (seconds: number) => string
    chapter: (chapter: number, progress?: number) => string
}

export function formatTime(seconds: number): string {
    const total = Math.max(0, Math.floor(seconds))
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    const mm = String(m).padStart(2, '0')
    const ss = String(s).padStart(2, '0')
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

/**
 * Collects what happens in a MiniMedi viewer (position, selected text, the subtitle
 * cues that were shown last) and turns it into the context text of the mini-chat.
 * Plain state, no React: events arrive often (every playback tick) and must not re-render.
 */
export function createViewerContext() {
    let position: Position | null = null
    let pages: number | undefined
    let selection: { text: string, position: Position } | null = null
    let recentLines: string[] = []

    function describe(pos: Position, labels: ViewerContextLabels, total?: number): string {
        const parts: string[] = []
        if (pos.page !== undefined) parts.push(labels.page(pos.page, total))
        if (pos.chapter !== undefined) parts.push(labels.chapter(pos.chapter, pos.progress))
        if (pos.time !== undefined) parts.push(labels.time(pos.time))
        return parts.join(', ')
    }

    return {
        handleEvent(event: MiniMediEvent): void {
            switch (event.event) {
                case 'mediaLoaded':
                    // A (new) medium was loaded: forget everything from the previous one
                    position = null
                    selection = null
                    recentLines = []
                    pages = event.pages
                    break
                case 'positionChange':
                    position = event.position
                    break
                case 'selection': {
                    const text = event.text.trim().slice(0, MAX_SELECTION_LENGTH)
                    selection = text ? {text, position: event.position} : null
                    break
                }
                case 'subtitleChange': {
                    const line = event.text.replace(/\s+/g, ' ').trim().slice(0, MAX_LINE_LENGTH)
                    if (line && recentLines[recentLines.length - 1] !== line) {
                        recentLines = [...recentLines, line].slice(-MAX_RECENT_LINES)
                    }
                    break
                }
            }
        },

        /** The context text; empty if nothing has happened yet. */
        build(labels: ViewerContextLabels): string {
            const lines: string[] = []
            const where = position ? describe(position, labels, pages) : ''
            if (where) lines.push(`${labels.position}: ${where}`)
            if (selection) {
                const at = describe(selection.position, labels, pages)
                lines.push(`${labels.selection}${at ? ` (${at})` : ''}: "${selection.text}"`)
            }
            if (recentLines.length > 0) {
                lines.push(`${labels.recentLines}: ${recentLines.map(l => `"${l}"`).join(' / ')}`)
            }
            return lines.join('\n')
        },
    }
}
