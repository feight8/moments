"use client";

import { useState } from "react";
import { buildEmojiRow, scoreToDot, DOT_EMOJI } from "@/lib/scoring";
import { formatPuzzleDate } from "@/lib/dates";
import StreakBadge from "@/components/StreakBadge";
import ScoreDisplay from "@/components/ScoreDisplay";
import type { SessionResult } from "@/types";

interface ResultsCardProps {
  result: SessionResult;
}

const dotBorderClass: Record<string, string> = {
  green:  "ring-dot-green/40",
  yellow: "ring-dot-yellow/40",
  orange: "ring-dot-orange/40",
  red:    "ring-dot-red/40",
};

export default function ResultsCard({ result }: ResultsCardProps) {
  const [copied, setCopied] = useState(false);

  const emojiRow = buildEmojiRow(result.guesses.map((g) => g.score));
  const dateLabel = formatPuzzleDate(result.date);
  const baseScore = result.guesses.reduce(
    (sum, g) => sum + Math.min(g.score, 100),
    0
  );
  const bonusScore = result.totalScore - baseScore;

  const shareText = [
    `Moments — ${dateLabel}`,
    emojiRow,
    `Score: ${result.totalScore} / 500${bonusScore > 0 ? ` (+${bonusScore} perfect bonus)` : ""}`,
    result.streak > 0 ? `Streak: 🔥 ${result.streak}` : "",
    "",
    "Play at moments.app",
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  async function handleCopy() {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-xs font-sans font-semibold uppercase tracking-widest text-ink-muted">
          {dateLabel}
        </p>
        <h2 className="font-serif text-3xl font-bold text-ink">Today&apos;s Results</h2>
        <div className="flex justify-center pt-1">
          <StreakBadge streak={result.streak} />
        </div>
      </div>

      {/* Emoji dot row */}
      <div className="flex justify-center gap-2 py-2">
        {result.guesses.map((g, i) => {
          const dot = scoreToDot(g.score);
          return (
            <div
              key={i}
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-white ring-2 ${dotBorderClass[dot]} shadow-sm`}
              title={`Event ${i + 1}: ${g.score} pts`}
            >
              <span className="text-xl" role="img" aria-label={dot}>
                {DOT_EMOJI[dot]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Score summary */}
      <div className="rounded-2xl border border-ink/10 bg-white/60 p-5 text-center backdrop-blur-sm">
        <p className="font-sans text-xs text-ink-muted uppercase tracking-widest mb-1">
          Total Score
        </p>
        <p className="font-serif text-5xl font-bold text-ink">
          {result.totalScore}
          <span className="font-sans text-xl font-normal text-ink-muted"> / 500</span>
        </p>
        {bonusScore > 0 && (
          <p className="mt-1 text-sm font-sans text-gold">
            Includes +{bonusScore} perfect bonus
            {result.perfectCount > 1 ? ` (${result.perfectCount} perfects)` : ""}
          </p>
        )}
      </div>

      {/* Per-event breakdown */}
      <div className="space-y-3">
        {result.guesses.map((g, i) => (
          <ScoreDisplay key={g.eventId} result={g} />
        ))}
      </div>

      {/* Share button */}
      <button
        onClick={handleCopy}
        className="w-full rounded-2xl bg-ink py-4 font-sans font-semibold text-parchment transition-colors hover:bg-ink/80 active:scale-95"
      >
        {copied ? "Copied!" : "Copy Results"}
      </button>

      {/* Share preview */}
      <div className="rounded-xl border border-ink/10 bg-white/40 p-4 font-sans text-sm text-ink-muted">
        <p className="text-xs uppercase tracking-widest mb-2 text-ink-muted/60">Preview</p>
        <pre className="whitespace-pre-wrap font-sans text-sm text-ink">{shareText}</pre>
      </div>
    </div>
  );
}
