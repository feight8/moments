"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NavHeader from "@/components/NavHeader";
import PlusGate from "@/components/PlusGate";
import CategorySwitcher, { type CategoryValue } from "@/components/CategorySwitcher";
import { createClient } from "@/lib/supabase/client";
import type { ArchiveEntry } from "@/app/api/archive/route";

function formatArchiveDate(dateStr: string): { day: string; month: string; year: string } {
  const d = new Date(dateStr + "T12:00:00Z");
  return {
    day:   d.toLocaleDateString("en-US", { day: "numeric",  timeZone: "UTC" }),
    month: d.toLocaleDateString("en-US", { month: "short",  timeZone: "UTC" }),
    year:  d.toLocaleDateString("en-US", { year: "numeric", timeZone: "UTC" }),
  };
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.round((score / 500) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-ink/10">
        <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-recoleta text-xs text-ink-muted">{score}</span>
    </div>
  );
}

export default function ArchivePage() {
  const [entries, setEntries] = useState<ArchiveEntry[] | null>(null);
  const [locked, setLocked]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryValue>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch("/api/archive", {
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });

      if (res.status === 403) { setLocked(true); return; }
      if (!res.ok) { setError("Could not load archive. Please try again."); return; }
      setEntries(await res.json());
    }
    load();
  }, []);

  // For each date, pick the puzzle that matches the selected category
  const displayEntries = entries
    ? entries
        .map((entry) => ({
          ...entry,
          puzzle: entry.puzzles.find((p) => p.category === category) ?? null,
        }))
        .filter((entry) => entry.puzzle !== null)
    : null;

  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-lg space-y-6">
        <NavHeader backHref="/" />

        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-recoleta text-3xl font-bold text-teal dark:text-ink">archive</h1>
            <p className="font-recoleta text-sm text-ink-muted">every puzzle, playable anytime</p>
          </div>
          <CategorySwitcher value={category} onChange={setCategory} />
        </div>

        {locked && <PlusGate locked feature="the puzzle archive" />}

        {error && (
          <p className="font-recoleta text-sm text-ink-muted text-center py-8">{error}</p>
        )}

        {!locked && !error && !entries && (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-gold" />
          </div>
        )}

        {displayEntries && displayEntries.length === 0 && (
          <div className="text-center py-12">
            <p className="font-recoleta text-lg text-ink">no past puzzles yet</p>
            <p className="font-recoleta text-sm text-ink-muted mt-1">check back after the first puzzle goes live</p>
          </div>
        )}

        {displayEntries && displayEntries.length > 0 && (
          <div className="rounded-2xl border border-ink/10 bg-surface/60 divide-y divide-ink/8 backdrop-blur-sm overflow-hidden">
            {displayEntries.map(({ date, puzzle }) => {
              const { day, month, year } = formatArchiveDate(date);
              const href = puzzle!.category
                ? `/play?date=${date}&category=${puzzle!.category}`
                : `/play?date=${date}`;

              return (
                <Link
                  key={date}
                  href={href}
                  className="flex items-center justify-between px-5 py-4 hover:bg-ink/3 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center w-10">
                      <p className="font-recoleta text-lg font-bold text-ink leading-tight">{day}</p>
                      <p className="font-recoleta text-[10px] text-ink-muted uppercase tracking-wide">{month}</p>
                    </div>
                    <div>
                      <p className="font-recoleta text-sm font-semibold text-ink">{year}</p>
                      {puzzle!.played ? (
                        <ScoreBar score={puzzle!.totalScore!} />
                      ) : (
                        <p className="font-recoleta text-xs text-ink-muted">not played</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-ink-muted">
                    {puzzle!.played && (
                      <span className="font-recoleta text-xs font-semibold">replay</span>
                    )}
                    <span className="text-lg group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
