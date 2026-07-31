import {useMemo} from 'react'
import {Link} from 'react-router-dom'
import {useQuery} from '@tanstack/react-query'
import {useTranslation} from 'react-i18next'
import {MemoryGame} from '@/games/memory'
import type {MemoryPair} from '@/games/memory'
import {fetchVocabularies} from '@/services/vocabulary.service'
import {useLanguage} from '@/context/TargetLanguageContext.tsx'

const PAIR_COUNT = 6
const MIN_PAIRS = 4

export default function MemoryGamePage() {
    const {t} = useTranslation(['common', 'vocabulary', 'game'])
    const {selectedLan} = useLanguage()

    const {data: vocabularies, isLoading, isError} = useQuery({
        queryKey: ['vocabularies', selectedLan],
        queryFn: () => fetchVocabularies(selectedLan ?? undefined),
        enabled: !!selectedLan,
    })

    const pairs = useMemo<MemoryPair[]>(() => {
        if (!vocabularies) return []
        const withTranslation = vocabularies.filter(v => v.translation)
        const shuffled = [...withTranslation].sort(() => Math.random() - 0.5)
        return shuffled.slice(0, PAIR_COUNT).map(v => ({
            id: v.id,
            contentA: v.word,
            contentB: v.translation!,
        }))
    }, [vocabularies])

    const handleComplete = (moves: number) => {
        console.log(`Memory game completed in ${moves} moves`)
    }

    return (
        <div className="max-w-xl mx-auto p-6">
            <Link to="/games" className="text-sm text-muted-foreground hover:underline">
                {t('common:buttons.back')}
            </Link>

            <h1 className="text-xl font-semibold my-4">{t('game:memory.title')}</h1>

            {!selectedLan ? (
                <p className="text-sm text-muted-foreground">{t('common:noLanguageSelected')}</p>
            ) : isLoading ? (
                <p className="text-sm text-muted-foreground">{t('common:loading')}</p>
            ) : isError ? (
                <p className="text-sm text-destructive">{t('common:errorLoading')}</p>
            ) : pairs.length < MIN_PAIRS ? (
                <p className="text-sm text-muted-foreground">{t('vocabulary:notEnoughForMemory')}</p>
            ) : (
                <MemoryGame
                    pairs={pairs}
                    onComplete={handleComplete}
                    key={pairs.map((p) => p.id).join(",")}
                />
            )}
        </div>
    )
}