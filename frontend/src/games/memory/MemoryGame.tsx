import {useEffect} from "react";
import {useTranslation} from "react-i18next";
import {useMemoryGame} from "./hooks/useMemoryGame";
import {MemoryCard} from "./components/MemoryCard";
import type {MemoryPair} from "./types";

interface MemoryGameProps {
    pairs: MemoryPair[];
    onComplete?: (moves: number) => void;
}

export function MemoryGame({pairs, onComplete}: MemoryGameProps) {
    const {t} = useTranslation("game");
    const {cards, isComplete, moves, flipCard, reset} = useMemoryGame(pairs);

    // Calling a parent callback (not our own setState) inside an effect
    // is fine — this doesn't trigger set-state-in-effect
    useEffect(() => {
        if (isComplete) {
            onComplete?.(moves);
        }
    }, [isComplete]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t("memory.moves", {count: moves})}</span>
                <button type="button" onClick={reset} className="text-sm underline">
                    {t("memory.restart")}
                </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
                {cards.map((card) => (
                    <MemoryCard
                        key={card.cardId}
                        content={card.content}
                        isFlipped={card.isFlipped}
                        isMatched={card.isMatched}
                        onClick={() => flipCard(card.cardId)}
                    />
                ))}
            </div>

            {isComplete && (
                <p className="text-center text-sm font-medium">{t("memory.solved", {count: moves})}</p>
            )}
        </div>
    );
}