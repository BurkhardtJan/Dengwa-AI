import {useNavigate} from 'react-router-dom'
import {useTranslation} from 'react-i18next'

interface Props {
    chatId: string
    title: string | null | undefined
    mediaTitle: string | undefined
    isDeleting: boolean
    onDelete: () => void
}

export default function ChatHeader({title, mediaTitle, isDeleting, onDelete}: Props) {
    const navigate = useNavigate()
    const {t} = useTranslation(['chat', 'common'])

    return (
        <div className="flex justify-between items-start mb-6">
            <div>
                <button
                    onClick={() => navigate('/chat')}
                    className="text-sm text-muted-foreground hover:underline mb-4 block"
                >
                    {t('backToChats')}
                </button>
                <h1 className="text-3xl font-bold">
                    {title ?? (mediaTitle ? `${t('title')}: ${mediaTitle}` : t('conversation'))}
                </h1>
                {mediaTitle && (
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