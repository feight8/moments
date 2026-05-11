"use client";

import { useState } from "react";
import { buildEmojiRow, scoreToDot, DOT_EMOJI } from "@/lib/scoring";
import { formatPuzzleDate } from "@/lib/dates";
import StreakBadge from "@/components/StreakBadge";
import ScoreDisplay from "@/components/ScoreDisplay";
import ScoreDistribution from "@/components/ScoreDistribution";
import type { SessionResult, Group } from "@/types";
import type { DistributionBucket } from "@/app/api/distribution/route";

interface ResultsCardProps {
  result: SessionResult;
  distribution?: { buckets: DistributionBucket[]; totalPlayers: number } | null;
  groups?: Group[] | null;
}

const dotBorderClass: Record<string, string> = {
  gem:      "ring-gold/40",
  artifact: "ring-dot-green/40",
  coin:     "ring-dot-yellow/40",
  fossil:   "ring-dot-orange/40",
  rock:     "ring-dot-red/40",
};

export default function ResultsCard({ result, distribution, groups }: ResultsCardProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const emojiRow = buildEmojiRow(result.guesses.map((g) => g.score));
  const dateLabel = formatPuzzleDate(result.date);
  const baseScore = result.guesses.reduce(
    (sum, g) => sum + Math.min(g.score, 100),
    0
  );
  const bonusScore = result.totalScore - baseScore;

  const shareText = [
    `circa - ${dateLabel}`,
    emojiRow,
    `score: ${result.totalScore}/500${bonusScore > 0 ? ` (+${bonusScore} perfect)` : ""}`,
    result.streak > 0 ? `streak: 🔥 ${result.streak}` : "",
    "",
    "play at circagame.com",
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        return;
      } catch {
        // user cancelled or share failed - fall through to clipboard
      }
    }
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
        <h2 className="font-serif text-3xl font-bold text-teal">today&apos;s results</h2>
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
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-surface ring-2 ${dotBorderClass[dot]} shadow-sm`}
              title={`event ${i + 1}: ${g.score} pts`}
            >
              <span className="text-xl" role="img" aria-label={dot}>
                {DOT_EMOJI[dot]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Total score */}
      <div className="rounded-2xl border border-ink/10 bg-surface/60 p-5 text-center backdrop-blur-sm">
        <p className="font-sans text-xs text-ink-muted uppercase tracking-widest mb-1">
          total score
        </p>
        <p className="font-serif text-5xl font-bold text-ink">
          {result.totalScore}
          <span className="font-sans text-xl font-normal text-ink-muted"> / 500</span>
        </p>
        {bonusScore > 0 && (
          <p className="mt-1 text-sm font-sans text-gold">
            includes +{bonusScore} perfect bonus
            {result.perfectCount > 1 ? ` (${result.perfectCount} perfects)` : ""}
          </p>
        )}
      </div>

      {/* Share button */}
      <button
        onClick={handleShare}
        className="btn-primary w-full py-4 transition-colors active:scale-95"
      >
        {shared ? "shared!" : copied ? "copied!" : "share results"}
      </button>

      {/* Share preview */}
      <div className="rounded-xl border border-ink/10 bg-surface/40 p-4 font-sans text-sm text-ink-muted">
        <p className="text-xs uppercase tracking-widest mb-2 text-ink-muted/60">preview</p>
        <pre className="whitespace-pre-wrap font-sans text-sm text-ink">{shareText}</pre>
      </div>

      {/* Score distribution chart */}
      {distribution && distribution.totalPlayers > 0 && (
        <ScoreDistribution
          buckets={distribution.buckets}
          totalPlayers={distribution.totalPlayers}
          userScore={result.totalScore}
        />
      )}

      {/* Groups */}
      {groups !== null && groups !== undefined && (
        <section className="space-y-3">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-ink-muted">
            your groups
          </h2>
          {groups.length > 0 ? (
            <div className="space-y-2">
              {groups.map((g) => (
                <a
                  key={g.id}
                  href={`/groups/${g.id}`}
                  className="flex items-center justify-between rounded-2xl border border-ink/10 bg-surface/60 px-5 py-4 hover:bg-surface/80 transition-colors group"
                >
                  <div>
                    <p className="font-serif text-base font-bold text-ink">{g.name}</p>
                    <p className="font-sans text-xs text-ink-muted mt-0.5">
                      {g.memberCount} {g.memberCount === 1 ? "member" : "members"}
                    </p>
                  </div>
                  <span className="text-ink-muted group-hover:translate-x-0.5 transition-transform">→</span>
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-ink/10 bg-surface/60 p-5 text-center space-y-2">
              <p className="font-sans text-sm text-ink-muted">play with friends and compare scores</p>
              <a href="/groups" className="font-sans text-sm font-semibold text-gold hover:text-gold/80 transition-colors">
                create a group →
              </a>
            </div>
          )}
        </section>
      )}

      {/* Per-event breakdown */}
      <div className="space-y-3">
        {result.guesses.map((g) => (
          <ScoreDisplay key={g.eventId} result={g} />
        ))}
      </div>
    </div>
  );
}
