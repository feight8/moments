import { scoreToDot, DOT_EMOJI } from "@/lib/scoring";
import TimelineReveal from "@/components/TimelineReveal";
import type { GuessResult } from "@/types";

interface RevealCardProps {
  result: GuessResult;
  eventNumber: number;
  description: string;
}

const dotBgClass: Record<string, string> = {
  gem:      "bg-gold/10 border-gold/30",
  artifact: "bg-dot-green/10 border-dot-green/30",
  coin:     "bg-dot-yellow/10 border-dot-yellow/30",
  fossil:   "bg-dot-orange/10 border-dot-orange/30",
  rock:     "bg-dot-red/10 border-dot-red/30",
};

const dotTextClass: Record<string, string> = {
  gem:      "text-gold",
  artifact: "text-dot-green",
  coin:     "text-dot-yellow",
  fossil:   "text-dot-orange",
  rock:     "text-dot-red",
};

function getFeedback(distance: number, isPerfect: boolean): string {
  if (isPerfect) return "incredible - exact year!";
  if (distance <= 1)  return "almost perfect - just one year off!";
  if (distance <= 5)  return `outstanding - only ${distance} years off.`;
  if (distance <= 15) return `very close - ${distance} years off.`;
  if (distance <= 30) return `nice - ${distance} years off.`;
  if (distance <= 75) return `not bad - ${distance} years off.`;
  if (distance <= 150) return `${distance} years off - you're in the right era.`;
  return `${distance} years off - a tough one!`;
}

export default function RevealCard({ result, eventNumber, description }: RevealCardProps) {
  const dot = scoreToDot(result.score);
  const distance = Math.abs(result.guessYear - result.correctYear);
  const feedback = getFeedback(distance, result.isPerfect);

  return (
    <div className="space-y-4">
      {/* Score banner */}
      <div className={`rounded-2xl border p-5 ${dotBgClass[dot]}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label={dot}>
              {DOT_EMOJI[dot]}
            </span>
            <span className={`font-serif text-2xl font-bold ${dotTextClass[dot]}`}>
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

        {/* Feedback line */}
        <p className="mt-2 font-sans text-sm font-medium text-ink">{feedback}</p>

        {/* Timeline reveal */}
        <div className="mt-4">
          <TimelineReveal guessYear={result.guessYear} correctYear={result.correctYear} />
        </div>
      </div>

      {/* Reveal image */}
      {result.revealImageUrl && (
        <div className="overflow-hidden rounded-2xl border border-ink/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.revealImageUrl}
            alt={`Image related to the event from ${result.correctYear}`}
            className="w-full object-cover max-h-64"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLElement).closest(".overflow-hidden")?.remove();
            }}
          />
        </div>
      )}

      {/* Additional context */}
      {result.additionalContext && (
        <div className="rounded-2xl border border-ink/10 bg-white/60 p-5 backdrop-blur-sm">
          <p className="mb-2 text-xs font-sans font-semibold uppercase tracking-widest text-ink-muted">
            the story
          </p>
          <p className="font-serif text-base leading-relaxed text-ink">
            {result.additionalContext}
          </p>
        </div>
      )}
    </div>
  );
}
