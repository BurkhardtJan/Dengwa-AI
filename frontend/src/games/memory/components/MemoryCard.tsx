interface MemoryCardProps {
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
  onClick: () => void;
}

export function MemoryCard({ content, isFlipped, isMatched, onClick }: MemoryCardProps) {
  const revealed = isFlipped || isMatched;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={revealed}
      className={`aspect-square rounded-lg flex items-center justify-center text-lg font-medium transition-colors
        ${revealed ? "bg-primary/10 border-primary" : "bg-muted hover:bg-muted/80"}
        ${isMatched ? "opacity-60" : ""} border`}
    >
      {revealed ? content : "?"}
    </button>
  );
}