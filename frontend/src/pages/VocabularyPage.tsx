import {useQuery} from '@tanstack/react-query'
import {fetchVocabularies} from '../services/vocabulary.service'
import type {components} from '../types/api'

type Vocabulary = components['schemas']['VocabularyResponse']

function VocabularyPage() {
    const {data, isLoading, isError} = useQuery({
        queryKey: ['vocabularies'],
        queryFn: fetchVocabularies
    })

    if (isLoading) return <p className="p-8">Lädt...</p>
    if (isError) return <p className="p-8 text-red-500">Fehler beim Laden</p>

    return (
        <div className="min-h-screen p-8">
            <h1 className="text-3xl font-bold mb-8">Vokabeln</h1>
            <div className="grid gap-4">
                {data.map((vocab: Vocabulary) => (
                    <div key={vocab.id} className="border rounded-lg p-4">
                        <p className="font-medium">{vocab.word}</p>
                        <p className="text-muted-foreground">{vocab.translation}</p>
                        <p className="text-muted-foreground">{vocab.context_sentence}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default VocabularyPage