"use client";

import { useEffect, useState } from "react";
import { YEAR_MIN, YEAR_MAX } from "@/lib/scoring";

interface TimelineRevealProps {
  guessYear: number;
  correctYear: number;
}

const RANGE = YEAR_MAX - YEAR_MIN; // 1025

function yearToPercent(year: number): number {
  return ((year - YEAR_MIN) / RANGE) * 100;
}

const CENTURY_MARKS = [1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000];

// Duration of the sweep
const SWEEP_MS = 3200;
// Summary row fades in shortly after the cursor lands
const SUMMARY_DELAY_MS = SWEEP_MS + 250;

export default function TimelineReveal({ guessYear, correctYear }: TimelineRevealProps) {
  const [swept, setSwept]     = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const isPerfect  = guessYear === correctYear;
  const correctPct = yearToPercent(correctYear);
  const guessPct   = yearToPercent(guessYear);
  const distance   = Math.abs(guessYear - correctYear);

  useEffect(() => {
    // Brief pause so the guess marker is seen before the sweep begins
    const t1 = setTimeout(() => setSwept(true), 300);
    const t2 = setTimeout(() => setShowSummary(true), SUMMARY_DELAY_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Fast start, steady cruise, heavy deceleration near the target
  const sweepEasing   = "cubic-bezier(0.25, 0.1, 0.1, 1.0)";
  const sweepDuration = `${SWEEP_MS}ms`;

  return (
    <div className="select-none space-y-1" aria-hidden="true">

      {/* ── Track ──────────────────────────────────────────────────── */}
      <div className="relative h-7">

        {/* Rail */}
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 rounded-full bg-ink/10" />

        {/* Swept fill — grows with the cursor */}
        <div
          className="absolute left-0 top-1/2 h-px -translate-y-1/2 rounded-full bg-gold/25 origin-left"
          style={{
            width: swept ? `${correctPct}%` : "0%",
            transition: `width ${sweepDuration} ${sweepEasing}`,
          }}
        />

        {/* Century tick marks */}
        {CENTURY_MARKS.map((yr) => (
          <div
            key={yr}
            className="absolute top-1/2 w-px h-2 -translate-y-1/2 bg-ink/10"
            style={{ left: `${yearToPercent(yr)}%` }}
          />
        ))}

        {/* Guess marker — visible from the start (hidden if perfect) */}
        {!isPerfect && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            style={{ left: `${guessPct}%` }}
          >
            <div className="w-0.5 h-4 rounded-full bg-ink/30" />
            <div className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-ink/30" />
          </div>
        )}

        {/* Correct year cursor — the animated seeker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{
            left: swept ? `${correctPct}%` : "0%",
            transition: `left ${sweepDuration} ${sweepEasing}`,
          }}
        >
          <div className="w-1 h-6 rounded-full bg-gold shadow-[0_0_6px_rgba(212,175,55,0.6)]" />
          <div className="absolute -top-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-gold shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
        </div>
      </div>

      {/* ── Range labels ───────────────────────────────────────────── */}
      <div className="flex justify-between font-sans text-[10px] text-ink/25 px-0.5">
        <span>{YEAR_MIN}</span>
        <span>{YEAR_MAX}</span>
      </div>

      {/* ── Summary row — fades in after cursor lands ──────────────── */}
      <div
        className="transition-opacity duration-500 pt-3"
        style={{ opacity: showSummary ? 1 : 0 }}
      >
        {isPerfect ? (
          <div className="flex justify-center">
            <span className="rounded-full bg-gold/15 px-4 py-1.5 font-sans text-sm font-semibold text-gold">
              {correctYear} — perfect!
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-xl bg-ink/4 px-4 py-3">
            <div className="text-center">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-ink-muted">your guess</p>
              <p className="font-serif text-xl font-bold text-ink mt-0.5">{guessYear}</p>
            </div>
            <div className="text-center px-2">
              <p className="font-sans text-xs text-ink-muted">
                {distance === 1 ? "1 year off" : `${distance} years off`}
              </p>
            </div>
            <div className="text-center">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-gold">correct</p>
              <p className="font-serif text-xl font-bold text-gold mt-0.5">{correctYear}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
