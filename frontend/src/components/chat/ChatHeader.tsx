import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import {Pencil} from 'lucide-react'

interface Props {
    chatId: string
    title: string | null | undefined
    mediaTitle: string | undefined
    isFreeConversation: boolean
    isDeleting: boolean
    isRenaming: boolean
    onDelete: () => void
    onRename: (newTitle: string) => void
}

export default function ChatHeader({
                                       title,
                                       mediaTitle,
                                       isFreeConversation,
                                       isDeleting,
                                       isRenaming,
                                       onDelete,
                                       onRename
                                   }: Props) {
    const navigate = useNavigate()
    const {t} = useTranslation(['chat', 'common'])
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [titleDraft, setTitleDraft] = useState('')

    const displayTitle = title ?? (isFreeConversation ? t('freeConversation') : mediaTitle ? `${t('title')}: ${mediaTitle}` : t('conversation'))

    const handleTitleSubmit = () => {
        const trimmed = titleDraft.trim()
        if (trimmed && trimmed !== title) onRename(trimmed)
        setIsEditingTitle(false)
    }

    return (
        <div className="flex justify-between items-start mb-6">
            <div>
                <button
                    onClick={() => navigate('/chat')}
                    className="text-sm text-muted-foreground hover:underline mb-4 block"
                >
                    {t('backToChats')}
                </button>

                {isEditingTitle ? (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleTitleSubmit()
                        }}
                        className="flex items-center gap-2"
                    >
                        <input
                            value={titleDraft}
                            onChange={(e) => setTitleDraft(e.target.value)}
                            autoFocus
                            className="text-3xl font-bold border-b bg-transparent focus:outline-none"
                        />
                        <button
                            type="submit"
                            disabled={isRenaming}
                            className="text-sm text-primary hover:underline disabled:opacity-50"
                        >
                            {isRenaming ? t('common:buttons.saving') : t('common:buttons.save')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditingTitle(false)}
                            className="text-sm text-muted-foreground hover:underline"
                        >
                            {t('common:buttons.cancel')}
                        </button>
                    </form>
                ) : (
                    <h1 className="text-3xl font-bold flex items-center gap-2 group">
                        {displayTitle}
                        <button
                            onClick={() => {
                                setTitleDraft(title ?? displayTitle)
                                setIsEditingTitle(true)
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                            title={t('common:buttons.edit')}
                        >
                            <Pencil size={16}/>
                        </button>
                    </h1>
                )}

                {isFreeConversation ? (
                    <p className="text-sm text-muted-foreground mt-1">{t('freeConversation')}</p>
                ) : mediaTitle && (
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('medium')}: <span className="font-medium">{mediaTitle}</span>
                    </p>
                )}
            </div>
            <button
                onClick={() => {
                    if (confirm(t('deleteConfirm'))) onDelete()
                }}
                disabled={isDeleting}
                className="text-destructive border border-destructive/30 px-3 py-1.5 rounded-lg hover:bg-destructive/5 text-sm transition-colors disabled:opacity-50"
            >
                {isDeleting ? t('common:buttons.deleting') : t('deleteButton')}
            </button>
        </div>
    )
}