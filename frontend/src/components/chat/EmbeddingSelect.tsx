import {useTranslation} from 'react-i18next'
import {useQuery} from '@tanstack/react-query'
import {fetchEmbeddingProviders} from '@/services/model.service.ts'

interface Props {
    value: string | null
    onChange: (value: string | null) => void
}

export default function EmbeddingSelect({value, onChange}: Props) {
    const {t} = useTranslation('chat')
    const {data, isLoading} = useQuery({
        queryKey: ['embeddingProviders'],
        queryFn: fetchEmbeddingProviders,
        staleTime: 10 * 60 * 1000
    })

    return (
        <select
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
            disabled={isLoading}
            className="text-xs border rounded-md px-2 py-1 bg-background disabled:opacity-50"
        >
            <option value="">{t('settings.default')}</option>
            {(data?.models ?? []).map((m) => (
                <option key={m} value={m}>{m}</option>
            ))}
        </select>
    )
}