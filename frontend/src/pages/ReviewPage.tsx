import {useState} from 'react'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {useTranslation} from 'react-i18next'
import {useLanguage} from '@/context/TargetLanguageContext.tsx'
import {useMedium} from '@/context/MediumContext'
import {fetchLanguages} from '@/services/language.service'
import {fetchNextReviewCard, fetchReviewCounts, submitReview} from '@/services/review.service.ts'
import type {ReviewEase} from '@/services/review.service.ts'
import SpeakButton from '@/components/SpeakButton'

const GRADES: { ease: ReviewEase; labelKey: string; className: string }[] = [
    {ease: 1, labelKey: 'review:again', className: 'bg-destructive text-destructive-foreground hover:opacity-90'},
    {ease: 2, labelKey: 'review:hard', className: 'border hover:bg-muted'},
    {ease: 3, labelKey: 'review:good', className: 'border hover:bg-muted'},
    {ease: 4, labelKey: 'review:easy', className: 'bg-primary text-primary-foreground hover:opacity-90'},
]

function ReviewPage() {
    const {selectedLan} = useLanguage()
    const {mediumId} = useMedium()
    const queryClient = useQueryClient()
    const [revealed, setRevealed] = useState(false)
    const {t} = useTranslation(['common', 'review'])

    const {data: languages} = useQuery({
        queryKey: ['languages'],
        queryFn: fetchLanguages,
    })
    const learningId = languages?.find(l => l.learning_language === selectedLan)?.id

    const {data: card, isLoading, isError} = useQuery({
        queryKey: ['review-next', learningId, mediumId],
        queryFn: () => fetchNextReviewCard({
            learning_id: learningId,
            ...(mediumId ? {media_id: mediumId} : {}),
        }),
        enabled: !!learningId,
    })

    const {data: counts} = useQuery({
        queryKey: ['review-count', learningId, mediumId],
        queryFn: () => fetchReviewCounts({
            learning_id: learningId,
            ...(mediumId ? {media_id: mediumId} : {}),
        }),
        enabled: !!learningId,
    })

    const reviewMutation = useMutation({
        mutationFn: (ease: ReviewEase) => submitReview(card!.id, ease),
        onSuccess: () => {
            setRevealed(false)
            queryClient.invalidateQueries({queryKey: ['review-next', learningId, mediumId]})
            queryClient.invalidateQueries({queryKey: ['review-count', learningId, mediumId]})
        },
    })

    if (!selectedLan) return <p className="p-8 text-muted-foreground">{t('common:noLanguageSelected')}</p>
    if (isLoading) return <p className="p-8">{t('common:loading')}</p>
    if (isError) return <p className="p-8 text-destructive">{t('common:errorLoading')}</p>

    return (
        <div className="min-h-screen p-8 max-w-xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">{t('review:title')}</h1>
                {counts && (
                    <div className="flex gap-2 text-xs font-medium">
                        <span
                            className="px-2.5 py-1 rounded-full bg-primary/10 text-primary">{t('review:new')}: {counts.new}</span>
                        <span
                            className="px-2.5 py-1 rounded-full bg-destructive/10 text-destructive">{t('review:learning')}: {counts.learning}</span>
                        <span
                            className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{t('review:due')}: {counts.review}</span>
                    </div>
                )}
            </div>

            {!card ? (
                <div className="border rounded-lg p-12 text-center">
                    <p className="text-lg font-medium mb-1">{t('review:allDone')}</p>
                    <p className="text-muted-foreground text-sm">{t('review:allDoneHint')}</p>
                </div>
            ) : (
                <div className="border rounded-lg p-10 text-center min-h-64 flex flex-col justify-center gap-4">
                    <span
                        className="text-xs uppercase tracking-wide text-muted-foreground">{t(`review:queue.${card.queue}`)}</span>
                    <div className="flex items-center justify-center gap-1">
                        <p className="text-2xl font-bold">{card.word}</p>
                        <SpeakButton text={card.word} lang={card.language} size={18}/>
                    </div>

                    {revealed ? (
                        <div className="mt-2 space-y-2">
                            <p className="text-lg text-muted-foreground">{card.translation}</p>
                            {card.context_sentence && (
                                <p className="text-sm italic text-muted-foreground flex items-center justify-center gap-1">
                                    <span>{card.context_sentence}</span>
                                    <SpeakButton text={card.context_sentence} lang={card.language}/>
                                </p>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => setRevealed(true)}
                            className="mx-auto mt-2 px-6 py-2 border rounded-lg text-sm font-medium hover:bg-muted"
                        >
                            {t('review:reveal')}
                        </button>
                    )}
                </div>
            )}

            {card && revealed && (
                <div className="grid grid-cols-4 gap-2 mt-6">
                    {GRADES.map(g => (
                        <button
                            key={g.ease}
                            onClick={() => reviewMutation.mutate(g.ease)}
                            disabled={reviewMutation.isPending}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50 ${g.className}`}
                        >
                            {t(g.labelKey)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default ReviewPage