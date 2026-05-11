"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NavHeader from "@/components/NavHeader";
import PlusGate from "@/components/PlusGate";
import { createClient } from "@/lib/supabase/client";
import type { ArchiveEntry } from "@/app/api/archive/route";

function formatArchiveDate(dateStr: string): { display: string; sub: string } {
  const d = new Date(dateStr + "T12:00:00Z");
  return {
    display: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
    sub: d.toLocaleDateString("en-US", { year: "numeric", timeZone: "UTC" }),
  };
}

function ScoreDots({ score }: { score: number }) {
  // Simple visual bar out of 500
  const pct = Math.min(100, Math.round((score / 500) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-ink/10">
        <div
          className="h-full rounded-full bg-gold"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-sans text-xs text-ink-muted">{score}</span>
    </div>
  );
}

export default function ArchivePage() {
  const [entries, setEntries] = useState<ArchiveEntry[] | null>(null);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch("/api/archive", {
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });

      if (res.status === 403) {
        setLocked(true);
        return;
      }
      if (!res.ok) {
        setError("Could not load archive. Please try again.");
        return;
      }
      setEntries(await res.json());
    }
    load();
  }, []);

  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-lg space-y-6">
        <NavHeader backHref="/" />

        <div className="space-y-1">
          <h1 className="font-serif text-3xl font-bold text-teal">archive</h1>
          <p className="font-sans text-sm text-ink-muted">every puzzle, playable anytime</p>
        </div>

        {/* Plus gate */}
        {locked && (
          <PlusGate locked feature="the puzzle archive" />
        )}

        {/* Error */}
        {error && (
          <p className="font-sans text-sm text-ink-muted text-center py-8">{error}</p>
        )}

        {/* Loading */}
        {!locked && !error && !entries && (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-gold" />
          </div>
        )}

        {/* Empty */}
        {entries && entries.length === 0 && (
          <div className="text-center py-12">
            <p className="font-serif text-lg text-ink">no past puzzles yet</p>
            <p className="font-sans text-sm text-ink-muted mt-1">check back after the first puzzle goes live</p>
          </div>
        )}

        {/* Archive list */}
        {entries && entries.length > 0 && (
          <div className="rounded-2xl border border-ink/10 bg-surface/60 divide-y divide-ink/8 backdrop-blur-sm overflow-hidden">
            {entries.map((entry) => {
              const { display, sub } = formatArchiveDate(entry.date);
              return (
                <Link
                  key={entry.date}
                  href={`/play?date=${entry.date}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-ink/3 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center w-10">
                      <p className="font-serif text-lg font-bold text-ink leading-tight">{display.split(" ")[1]}</p>
                      <p className="font-sans text-[10px] text-ink-muted uppercase tracking-wide">{display.split(" ")[0]}</p>
                    </div>
                    <div>
                      <p className="font-sans text-sm font-semibold text-ink">{sub}</p>
                      {entry.played ? (
                        <ScoreDots score={entry.totalScore!} />
                      ) : (
                        <p className="font-sans text-xs text-ink-muted">not played</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-ink-muted">
                    {entry.played && (
                      <span className="font-sans text-xs text-ink-muted font-semibold">replay</span>
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
