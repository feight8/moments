"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NavHeader from "@/components/NavHeader";
import PlusGate from "@/components/PlusGate";
import { createClient } from "@/lib/supabase/client";
import type { ArchiveEntry } from "@/app/api/archive/route";

function formatArchiveDate(dateStr: string): { day: string; month: string; year: string } {
  const d = new Date(dateStr + "T12:00:00Z");
  return {
    day:   d.toLocaleDateString("en-US", { day: "numeric",   timeZone: "UTC" }),
    month: d.toLocaleDateString("en-US", { month: "short",   timeZone: "UTC" }),
    year:  d.toLocaleDateString("en-US", { year: "numeric",  timeZone: "UTC" }),
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
  const [entries, setEntries]   = useState<ArchiveEntry[] | null>(null);
  const [locked, setLocked]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(date: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date); else next.add(date);
      return next;
    });
  }

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

  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-lg space-y-6">
        <NavHeader backHref="/" />

        <div className="space-y-1">
          <h1 className="font-recoleta text-3xl font-bold text-teal dark:text-ink">archive</h1>
          <p className="font-recoleta text-sm text-ink-muted">every puzzle, playable anytime</p>
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

        {entries && entries.length === 0 && (
          <div className="text-center py-12">
            <p className="font-recoleta text-lg text-ink">no past puzzles yet</p>
            <p className="font-recoleta text-sm text-ink-muted mt-1">check back after the first puzzle goes live</p>
          </div>
        )}

        {entries && entries.length > 0 && (
          <div className="rounded-2xl border border-ink/10 bg-surface/60 divide-y divide-ink/8 backdrop-blur-sm overflow-hidden">
            {entries.map((entry) => {
              const { day, month, year } = formatArchiveDate(entry.date);
              const isOpen = expanded.has(entry.date);
              const isMulti = entry.totalCount > 1;
              const mainPuzzle = entry.puzzles[0];

              return (
                <div key={entry.date}>
                  {/* Date row */}
                  <button
                    onClick={() => toggle(entry.date)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-ink/3 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center w-10">
                        <p className="font-recoleta text-lg font-bold text-ink leading-tight">{day}</p>
                        <p className="font-recoleta text-[10px] text-ink-muted uppercase tracking-wide">{month}</p>
                      </div>
                      <div>
                        <p className="font-recoleta text-sm font-semibold text-ink">{year}</p>
                        {isMulti ? (
                          <p className="font-recoleta text-xs text-ink-muted">
                            {entry.playedCount}/{entry.totalCount} puzzles played
                          </p>
                        ) : mainPuzzle.played ? (
                          <ScoreBar score={mainPuzzle.totalScore!} />
                        ) : (
                          <p className="font-recoleta text-xs text-ink-muted">not played</p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-ink-muted transition-transform duration-200 ${
                        isOpen ? "rotate-90" : "group-hover:translate-x-0.5"
                      }`}
                    >
                      →
                    </span>
                  </button>

                  {/* Expanded sub-entries */}
                  {isOpen && (
                    <div className="border-t border-ink/8 divide-y divide-ink/5 bg-ink/[0.02]">
                      {entry.puzzles.map((puzzle) => {
                        const href = puzzle.category
                          ? `/play?date=${entry.date}&category=${puzzle.category}`
                          : `/play?date=${entry.date}`;
                        return (
                          <Link
                            key={puzzle.category ?? "daily"}
                            href={href}
                            className="flex items-center justify-between pl-16 pr-5 py-3 hover:bg-ink/3 transition-colors group"
                          >
                            <div>
                              <p className="font-recoleta text-sm font-semibold text-ink capitalize">
                                {puzzle.label}
                              </p>
                              {puzzle.played ? (
                                <ScoreBar score={puzzle.totalScore!} />
                              ) : (
                                <p className="font-recoleta text-xs text-ink-muted">not played</p>
                              )}
                            </div>
                            <span className="font-recoleta text-xs text-ink-muted font-semibold group-hover:translate-x-0.5 transition-transform">
                              {puzzle.played ? "replay" : "play"} →
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
