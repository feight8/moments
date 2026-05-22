"use client";

import type { DistributionBucket } from "@/app/api/distribution/route";

interface ScoreDistributionProps {
  buckets: DistributionBucket[];
  totalPlayers: number;
  userScore?: number;
  userPercentile?: number | null;
  branded?: boolean;
  showPercentage?: boolean;
  showPlayerCount?: boolean;
}

export default function ScoreDistribution({
  buckets,
  totalPlayers,
  userScore,
  userPercentile,
  branded,
  showPercentage,
  showPlayerCount,
}: ScoreDistributionProps) {
  if (totalPlayers === 0) return null;

  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  function isUserBucket(bucket: DistributionBucket): boolean {
    if (userScore === undefined) return false;
    return userScore >= bucket.min && userScore <= bucket.max;
  }

  const percentile = userPercentile !== undefined ? userPercentile : null;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="font-recoleta text-xs font-semibold uppercase tracking-widest text-ink-muted">
          today&apos;s scores
        </p>
        {showPlayerCount !== false && (
          <p className="font-recoleta text-xs text-ink-muted">
            {totalPlayers} {totalPlayers === 1 ? "player" : "players"}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-ink/10 bg-surface/60 px-5 pt-5 pb-4 backdrop-blur-sm space-y-2">
        {buckets.map((bucket) => {
          const pct = Math.round((bucket.count / maxCount) * 100);
          const active = isUserBucket(bucket);

          return (
            <div key={bucket.label} className="flex items-center gap-3">
              <p
                className={`font-recoleta text-xs w-16 flex-shrink-0 text-right tabular-nums ${
                  active ? "font-bold text-gold" : "text-ink-muted"
                }`}
              >
                {bucket.label}
              </p>
              <div className="flex-1 h-6 rounded-md overflow-hidden bg-ink/5 relative">
                <div
                  className={`h-full rounded-md transition-all duration-500 ${
                    active ? "bg-gold" : branded ? "bg-brand-orange" : "bg-ink/15"
                  }`}
                  style={{ width: `${Math.max(pct, bucket.count > 0 ? 2 : 0)}%` }}
                />
                {bucket.count > 0 && (
                  <span
                    className={`absolute inset-y-0 left-2 flex items-center font-recoleta text-xs ${
                      active ? "text-teal dark:text-gold font-semibold" : "text-ink-muted"
                    }`}
                  >
                    {showPercentage
                      ? `${Math.round((bucket.count / totalPlayers) * 100)}%`
                      : bucket.count}
                  </span>
                )}
              </div>
              {active && (
                <span className="font-recoleta text-xs text-gold font-semibold flex-shrink-0">
                  ← you
                </span>
              )}
            </div>
          );
        })}

        {percentile !== null && (
          <p className="font-recoleta text-xs text-ink-muted text-center pt-2 border-t border-ink/8 mt-3">
            you scored higher than{" "}
            <span className="font-semibold text-ink">{percentile}%</span> of players today
          </p>
        )}
      </div>
    </div>
  );
}
