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
