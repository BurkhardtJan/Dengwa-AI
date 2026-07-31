export interface MemoryPair {
    id: string;
    contentA: string;
    contentB: string;
}

export interface MemoryCardData {
    cardId: string;   // unique id per rendered card (two cards share a pairId)
    pairId: string;
    content: string;
    isFlipped: boolean;
    isMatched: boolean;
}

export interface MemoryGameState {
    cards: MemoryCardData[];
    flippedCardIds: string[];
    moves: number;
    isComplete: boolean;
}