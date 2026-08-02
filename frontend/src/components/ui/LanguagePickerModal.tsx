import {useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import Modal from '@/components/Modal'
import {ISO_639_1_CODES, getLanguageDisplayName} from '@/lib/languages'

type Props = {
    onClose: () => void
    onSelect: (value: string) => void
}

export default function LanguagePickerModal({onClose, onSelect}: Props) {
    const {t, i18n} = useTranslation('common')
    const [query, setQuery] = useState('')
    const [freeText, setFreeText] = useState('')

    const options = useMemo(() => {
        return ISO_639_1_CODES
            .map(code => ({code, name: getLanguageDisplayName(code, i18n.language)}))
            .sort((a, b) => a.name.localeCompare(b.name, i18n.language))
    }, [i18n.language])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return options
        return options.filter(o => o.name.toLowerCase().includes(q) || o.code.toLowerCase().includes(q))
    }, [options, query])

    return (
        <Modal onClose={onClose}>
            <h2 className="text-lg font-bold mb-4">{t('languagePicker.title')}</h2>
            <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('languagePicker.searchPlaceholder')}
                className="border rounded-lg px-3 py-2 w-full mb-3"
            />
            <div className="max-h-64 overflow-y-auto border rounded-lg divide-y mb-4">
                {filtered.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic p-3">{t('languagePicker.noMatches')}</p>
                ) : (
                    filtered.map(({code, name}) => (
                        <button
                            key={code}
                            type="button"
                            onClick={() => onSelect(code)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                        >
                            {name}
                        </button>
                    ))
                )}
            </div>

            <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground mb-2">{t('languagePicker.freeTextLabel')}</p>
                <div className="flex gap-2">
                    <input
                        value={freeText}
                        onChange={e => setFreeText(e.target.value)}
                        placeholder={t('languagePicker.freeTextPlaceholder')}
                        className="border rounded-lg px-3 py-2 flex-1 text-sm"
                    />
                    <button
                        type="button"
                        disabled={!freeText.trim()}
                        onClick={() => onSelect(freeText.trim())}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                        {t('buttons.add')}
                    </button>
                </div>
            </div>
        </Modal>
    )
}