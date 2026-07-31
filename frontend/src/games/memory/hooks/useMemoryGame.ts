import {useState, useCallback, useEffect, useRef} from "react";
import type {MemoryPair, MemoryCardData, MemoryGameState} from "../types";

const MISMATCH_DELAY_MS = 800;

// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function buildCards(pairs: MemoryPair[]): MemoryCardData[] {
    const cards: MemoryCardData[] = pairs.flatMap((pair) => [
        {cardId: `${pair.id}-a`, pairId: pair.id, content: pair.contentA, isFlipped: false, isMatched: false},
        {cardId: `${pair.id}-b`, pairId: pair.id, content: pair.contentB, isFlipped: false, isMatched: false},
    ]);
    return shuffle(cards);
}

export function useMemoryGame(pairs: MemoryPair[]) {
    const [state, setState] = useState<MemoryGameState>(() => ({
        cards: buildCards(pairs),
        flippedCardIds: [],
        moves: 0,
        isComplete: false,
    }));
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Cleanup only — no state writes here, so no lint issue
    useEffect(() => {
        return () => clearTimeout(timeoutRef.current);
    }, []);

    const flipCard = useCallback((cardId: string) => {
        setState((prev) => {
            if (prev.flippedCardIds.length === 2) return prev;

            const card = prev.cards.find((c) => c.cardId === cardId);
            if (!card || card.isFlipped || card.isMatched) return prev;

            const cards = prev.cards.map((c) =>
                c.cardId === cardId ? {...c, isFlipped: true} : c
            );
            const flippedCardIds = [...prev.flippedCardIds, cardId];

            // Second card just flipped -> evaluate the pair right here,
            // no separate effect needed
            if (flippedCardIds.length === 2) {
                const [firstId, secondId] = flippedCardIds;
                const first = cards.find((c) => c.cardId === firstId)!;
                const second = cards.find((c) => c.cardId === secondId)!;
                const isMatch = first.pairId === second.pairId;

                if (isMatch) {
                    const matchedCards = cards.map((c) =>
                        c.cardId === firstId || c.cardId === secondId
                            ? {...c, isMatched: true}
                            : c
                    );
                    return {
                        ...prev,
                        cards: matchedCards,
                        flippedCardIds: [],
                        moves: prev.moves + 1,
                        isComplete: matchedCards.every((c) => c.isMatched),
                    };
                }

                // Mismatch: flip back after a delay. This setState happens
                // inside a setTimeout callback, i.e. asynchronously — fine.
                timeoutRef.current = setTimeout(() => {
                    setState((s) => ({
                        ...s,
                        cards: s.cards.map((c) =>
                            c.cardId === firstId || c.cardId === secondId
                                ? {...c, isFlipped: false}
                                : c
                        ),
                        flippedCardIds: [],
                    }));
                }, MISMATCH_DELAY_MS);

                return {...prev, cards, flippedCardIds, moves: prev.moves + 1};
            }

            return {...prev, cards, flippedCardIds};
        });
    }, []);

    const reset = useCallback(() => {
        clearTimeout(timeoutRef.current);
        setState({
            cards: buildCards(pairs),
            flippedCardIds: [],
            moves: 0,
            isComplete: false,
        });
    }, [pairs]);

    return {...state, flipCard, reset};
}