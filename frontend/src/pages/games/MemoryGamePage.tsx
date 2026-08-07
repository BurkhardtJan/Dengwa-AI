import {useMemo} from 'react'
import {Link} from 'react-router-dom'
import {useQuery} from '@tanstack/react-query'
import {useTranslation} from 'react-i18next'
import {MemoryGame} from '@/games/memory'
import type {MemoryPair} from '@/games/memory'
import {fetchVocabularies} from '@/services/vocabulary.service'
import {fetchLanguages} from '@/services/language.service'
import {useLanguage} from '@/context/TargetLanguageContext.tsx'
import MiniChatLauncher from '@/components/chat/MiniChatLauncher'
import {PAGE_WIDTH, PAGE_PADDING} from '@/lib/layout'

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

    const {data: languages} = useQuery({
        queryKey: ['languages'],
        queryFn: fetchLanguages,
    })
    const learningId = languages?.find(l => l.learning_language === selectedLan)?.id

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
        <div className={`${PAGE_PADDING} ${PAGE_WIDTH}`}>
            <Link to="/games" className="text-sm text-muted-foreground hover:underline">
                {t('common:buttons.back')}
            </Link>

            <h1 className="text-3xl font-bold my-4">{t('game:memory.title')}</h1>

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

            {learningId && pairs.length > 0 && (
                <MiniChatLauncher
                    mediaId={learningId}
                    instanceKey={pairs.map(p => p.id).join(",")}
                    title={t('game:memory.title')}
                    getContext={() => `Memory-Wortpaare: ${pairs.map(p => `${p.contentA} = ${p.contentB}`).join(', ')}`}
                />
            )}
        </div>
    )
}