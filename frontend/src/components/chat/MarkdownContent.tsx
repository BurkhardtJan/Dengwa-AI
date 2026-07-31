import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type {Components} from 'react-markdown'

// Manual, minimal styling instead of @tailwindcss/typography (not installed
// in this project) — just enough to make headings/lists/code/links/tables
// readable inside a chat bubble.
const components: Components = {
    p: ({children}) => <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>,
    ul: ({children}) => <ul className="list-disc pl-5 mb-2 last:mb-0 space-y-0.5">{children}</ul>,
    ol: ({children}) => <ol className="list-decimal pl-5 mb-2 last:mb-0 space-y-0.5">{children}</ol>,
    li: ({children}) => <li>{children}</li>,
    a: ({children, ...props}) => (
        <a {...props} className="text-primary underline" target="_blank" rel="noreferrer">
            {children}
        </a>
    ),
    strong: ({children}) => <strong className="font-semibold">{children}</strong>,
    h1: ({children}) => <h1 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h1>,
    h2: ({children}) => <h2 className="text-sm font-semibold mb-2 mt-3 first:mt-0">{children}</h2>,
    h3: ({children}) => <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h3>,
    blockquote: ({children}) => (
        <blockquote className="border-l-2 pl-3 italic text-muted-foreground mb-2 last:mb-0">
            {children}
        </blockquote>
    ),
    code: ({className, children, ...props}) => {
        const isBlock = /language-/.test(className ?? '')
        if (isBlock) {
            return (
                <code
                    className={`block bg-muted rounded-lg p-3 overflow-x-auto text-xs mb-2 last:mb-0 ${className ?? ''}`} {...props}>
                    {children}
                </code>
            )
        }
        return (
            <code className="bg-muted px-1 py-0.5 rounded text-xs" {...props}>
                {children}
            </code>
        )
    },
    pre: ({children}) => <pre className="mb-2 last:mb-0">{children}</pre>,
    table: ({children}) => (
        <div className="overflow-x-auto mb-2 last:mb-0">
            <table className="text-xs border-collapse">{children}</table>
        </div>
    ),
    th: ({children}) => <th className="border px-2 py-1 text-left font-semibold">{children}</th>,
    td: ({children}) => <td className="border px-2 py-1">{children}</td>,
}

export default function MarkdownContent({content}: { content: string }) {
    return (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {content}
        </ReactMarkdown>
    )
}