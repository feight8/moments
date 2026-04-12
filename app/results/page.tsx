"use client";

import { useEffect, useState } from "react";
import ResultsCard from "@/components/ResultsCard";
import NavHeader from "@/components/NavHeader";
import type { SessionResult } from "@/types";

export default function ResultsPage() {
  const [result, setResult] = useState<SessionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Prefer result from sessionStorage (set immediately after submit)
    // to avoid a round-trip and flash of loading state
    const cached = sessionStorage.getItem("circa_result");
    if (cached) {
      try {
        setResult(JSON.parse(cached));
        return;
      } catch {
        // fall through to fetch
      }
    }

    fetch("/api/results")
      .then((res) => {
        if (!res.ok) throw new Error("No result found.");
        return res.json();
      })
      .then((data: SessionResult) => setResult(data))
      .catch(() => setError("Could not load your results. Please try again."));
  }, []);

  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-lg space-y-6">
        <NavHeader />

        {error && (
          <div className="text-center py-12 space-y-3">
            <p className="font-serif text-xl text-ink">{error}</p>
            <a href="/" className="font-sans text-sm text-ink-muted underline">
              back to home
            </a>
          </div>
        )}

        {!result && !error && (
          <div className="flex flex-col items-center gap-3 py-16 font-sans text-ink-muted">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-gold" />
            <p className="text-sm">loading results…</p>
          </div>
        )}

        {result && <ResultsCard result={result} />}

        {result && (
          <p className="text-center font-sans text-xs text-ink-muted pb-4">
            come back tomorrow for a new puzzle
          </p>
        )}
      </div>
    </main>
  );
}
