"use client";

import { useEffect, useState } from "react";
import NavHeader from "@/components/NavHeader";
import PlusGate from "@/components/PlusGate";
import { createClient } from "@/lib/supabase/client";
import { formatPuzzleDate } from "@/lib/dates";
import type { UserStats, EraAccuracy } from "@/app/api/stats/route";

// ---------------------------------------------------------------------------
// Stat tile
// ---------------------------------------------------------------------------

function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white/60 p-5 text-center backdrop-blur-sm">
      <p className="font-sans text-xs font-semibold uppercase tracking-widest text-ink-muted mb-1">{label}</p>
      <p className="font-serif text-3xl font-bold text-ink">{value}</p>
      {sub && <p className="font-sans text-xs text-ink-muted mt-0.5">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini score bar chart (last 30 games)
// ---------------------------------------------------------------------------

function ScoreHistory({ scores }: { scores: { date: string; score: number }[] }) {
  if (scores.length === 0) return null;
  const max = 500;

  return (
    <div>
      <p className="font-sans text-xs font-semibold uppercase tracking-widest text-ink-muted mb-3">
        Recent scores
      </p>
      <div className="rounded-2xl border border-ink/10 bg-white/60 px-4 pt-4 pb-3 backdrop-blur-sm">
        <div className="flex items-end gap-1 h-20">
          {scores.map(({ date, score }) => {
            const h = Math.max(4, Math.round((score / max) * 80));
            return (
              <div
                key={date}
                title={`${formatPuzzleDate(date)}: ${score} pts`}
                className="flex-1 rounded-t bg-gold/60 hover:bg-gold transition-colors cursor-default"
                style={{ height: `${h}px` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1 font-sans text-[10px] text-ink-muted">
          <span>{scores[0] ? formatPuzzleDate(scores[0].date) : ""}</span>
          <span>{scores[scores.length - 1] ? formatPuzzleDate(scores[scores.length - 1].date) : ""}</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Era accuracy breakdown
// ---------------------------------------------------------------------------

function EraBreakdown({ eras }: { eras: EraAccuracy[] }) {
  if (eras.length === 0) return null;
  const maxAvg = 100;

  return (
    <div>
      <p className="font-sans text-xs font-semibold uppercase tracking-widest text-ink-muted mb-3">
        Accuracy by era
      </p>
      <div className="rounded-2xl border border-ink/10 bg-white/60 divide-y divide-ink/8 backdrop-blur-sm overflow-hidden">
        {eras.map(({ era, count, avgScore }) => {
          const pct = Math.round((avgScore / maxAvg) * 100);
          return (
            <div key={era} className="flex items-center gap-3 px-5 py-3">
              <p className="font-sans text-sm font-semibold text-ink w-16 flex-shrink-0">{era}</p>
              <div className="flex-1 h-2 overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full rounded-full bg-gold/70"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-right flex-shrink-0 w-24">
                <span className="font-sans text-sm font-semibold text-ink">{avgScore} avg</span>
                <span className="font-sans text-xs text-ink-muted ml-1">({count})</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StatsPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch("/api/stats", {
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });

      if (res.status === 403) { setLocked(true); return; }
      if (!res.ok) { setError("Could not load stats."); return; }
      setStats(await res.json());
    }
    load();
  }, []);

  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-lg space-y-6">
        <NavHeader backHref="/" />

        <div className="space-y-1">
          <h1 className="font-serif text-3xl font-bold text-ink">your stats</h1>
          <p className="font-sans text-sm text-ink-muted">all-time performance</p>
        </div>

        {locked && <PlusGate locked feature="Stats" />}
        {error && <p className="font-sans text-sm text-ink-muted text-center py-8">{error}</p>}

        {!locked && !error && !stats && (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-gold" />
          </div>
        )}

        {stats && stats.totalGames === 0 && (
          <div className="text-center py-12 space-y-2">
            <p className="font-serif text-xl text-ink">no games yet</p>
            <p className="font-sans text-sm text-ink-muted">play today's puzzle to start building your stats</p>
          </div>
        )}

        {stats && stats.totalGames > 0 && (
          <div className="space-y-6">
            {/* Key stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Games played" value={stats.totalGames} />
              <StatTile label="Avg score" value={stats.avgScore} sub="out of 500" />
              <StatTile label="Best score" value={stats.bestScore} sub={stats.bestDate ? formatPuzzleDate(stats.bestDate) : undefined} />
              <StatTile label="Perfect guesses" value={stats.perfectGuesses} />
            </div>

            {/* Streak */}
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Current streak" value={`🔥 ${stats.currentStreak}`} sub="days" />
              <StatTile label="Longest streak" value={`🏆 ${stats.longestStreak}`} sub="days" />
            </div>

            {/* Score history chart */}
            <ScoreHistory scores={stats.recentScores} />

            {/* Era accuracy */}
            <EraBreakdown eras={stats.eraAccuracy} />
          </div>
        )}
      </div>
    </main>
  );
}
