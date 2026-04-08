import { scoreToDot, DOT_EMOJI } from "@/lib/scoring";
import type { ScoredGuess } from "@/types";

interface ScoreDisplayProps {
  result: ScoredGuess;
}

const dotColorClass: Record<string, string> = {
  green:  "text-dot-green",
  yellow: "text-dot-yellow",
  orange: "text-dot-orange",
  red:    "text-dot-red",
};

const dotBgClass: Record<string, string> = {
  green:  "bg-dot-green/10 border-dot-green/30",
  yellow: "bg-dot-yellow/10 border-dot-yellow/30",
  orange: "bg-dot-orange/10 border-dot-orange/30",
  red:    "bg-dot-red/10 border-dot-red/30",
};

export default function ScoreDisplay({ result }: ScoreDisplayProps) {
  const dot = scoreToDot(result.score);
  const distance = Math.abs(result.guessYear - result.correctYear);

  return (
    <div className={`rounded-2xl border p-5 ${dotBgClass[dot]}`}>
      {/* Dot + score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label={dot}>
            {DOT_EMOJI[dot]}
          </span>
          <span className={`font-serif text-2xl font-bold ${dotColorClass[dot]}`}>
            {result.score}
            <span className="text-sm font-sans font-normal text-ink-muted"> / 110</span>
          </span>
        </div>
        {result.isPerfect && (
          <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-sans font-semibold text-gold">
            Perfect +10
          </span>
        )}
      </div>

      {/* Guess vs correct */}
      <div className="mt-3 flex items-center gap-4 font-sans text-sm">
        <div>
          <p className="text-xs text-ink-muted">Your guess</p>
          <p className="font-semibold text-ink">{result.guessYear}</p>
        </div>
        <div className="text-ink-muted">→</div>
        <div>
          <p className="text-xs text-ink-muted">Correct year</p>
          <p className="font-semibold text-ink">{result.correctYear}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-ink-muted">Off by</p>
          <p className="font-semibold text-ink">
            {distance === 0 ? "—" : `${distance} yr${distance === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      {/* Event description */}
      <p className="mt-3 text-xs font-sans text-ink-muted line-clamp-2 italic">
        {result.description}
      </p>
    </div>
  );
}
