import { scoreToDot, DOT_EMOJI } from "@/lib/scoring";
import type { ScoredGuess } from "@/types";

interface ScoreDisplayProps {
  result: ScoredGuess;
}

const dotColorClass: Record<string, string> = {
  gem:      "text-gold",
  artifact: "text-dot-green",
  coin:     "text-dot-yellow",
  fossil:   "text-dot-orange",
  rock:     "text-dot-red",
};

const dotBgClass: Record<string, string> = {
  gem:      "bg-gold/10 border-gold/30",
  artifact: "bg-dot-green/10 border-dot-green/30",
  coin:     "bg-dot-yellow/10 border-dot-yellow/30",
  fossil:   "bg-dot-orange/10 border-dot-orange/30",
  rock:     "bg-dot-red/10 border-dot-red/30",
};

export default function ScoreDisplay({ result }: ScoreDisplayProps) {
  const dot = scoreToDot(result.score);
  const distance = Math.abs(result.guessYear - result.correctYear);

  return (
    <div className={`overflow-hidden rounded-2xl border ${dotBgClass[dot]}`}>
      {/* Reveal image */}
      {result.revealImageUrl && (
        <div className="relative h-40 w-full overflow-hidden bg-ink/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.revealImageUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              const parent = (e.target as HTMLElement).closest(".relative");
              if (parent) (parent as HTMLElement).style.display = "none";
            }}
          />
        </div>
      )}

      <div className="p-5">
        {/* Score row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label={dot}>
              {DOT_EMOJI[dot]}
            </span>
            <span className={`font-serif text-2xl font-bold ${dotColorClass[dot]}`}>
              {result.score}
              <span className="text-sm font-sans font-normal text-ink-muted"> / 100</span>
            </span>
          </div>
          {result.isPerfect && (
            <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-sans font-semibold text-gold">
              perfect +10
            </span>
          )}
        </div>

        {/* Guess vs correct */}
        <div className="mt-3 flex items-center gap-4 font-sans text-sm">
          <div>
            <p className="text-xs text-ink-muted">your guess</p>
            <p className="font-semibold text-ink">{result.guessYear}</p>
          </div>
          <div className="text-ink-muted">→</div>
          <div>
            <p className="text-xs text-ink-muted">correct year</p>
            <p className="font-semibold text-ink">{result.correctYear}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-ink-muted">off by</p>
            <p className="font-semibold text-ink">
              {distance === 0 ? "-" : `${distance} yr${distance === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="mt-3 text-xs font-sans text-ink-muted italic line-clamp-2">
          {result.description}
        </p>

        {/* Additional context */}
        {result.additionalContext && (
          <p className="mt-3 font-sans text-sm leading-relaxed text-ink/80 border-t border-ink/10 pt-3">
            {result.additionalContext}
          </p>
        )}
      </div>
    </div>
  );
}
