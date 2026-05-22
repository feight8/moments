"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ResultsCard from "@/components/ResultsCard";
import LinkAccountPrompt from "@/components/LinkAccountPrompt";
import NavHeader from "@/components/NavHeader";
import CategorySwitcher, { type CategoryValue } from "@/components/CategorySwitcher";
import type { SessionResult, Group } from "@/types";
import type { DistributionResponse } from "@/app/api/distribution/route";

function ResultsPageInner() {
  const searchParams = useSearchParams();
  const urlCategory = (searchParams.get("category") as CategoryValue) ?? null;

  const [category, setCategory]         = useState<CategoryValue>(urlCategory);
  const [result, setResult]             = useState<SessionResult | null>(null);
  const [distribution, setDistribution] = useState<DistributionResponse | null>(null);
  const [showLinkPrompt, setShowLinkPrompt] = useState(false);
  const [groups, setGroups]             = useState<Group[] | null>(null);
  const [error, setError]               = useState<string | null>(null);

  useEffect(() => {
    setResult(null);
    setDistribution(null);
    setError(null);

    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader: Record<string, string> = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {};

      // 1. Load result (sessionStorage first, then API)
      const storageKey = category ? `circa_result_${category}` : "circa_result";
      let sessionResult: SessionResult | null = null;
      const cached = sessionStorage.getItem(storageKey);
      if (cached) {
        try { sessionResult = JSON.parse(cached); } catch { /* fall through */ }
      }

      if (!sessionResult) {
        const url = category ? `/api/results?category=${category}` : "/api/results";
        const res = await fetch(url, { headers: authHeader });
        if (!res.ok) {
          setError(category ? `no ${category} result found for today` : "could not load your results. please try again.");
          return;
        }
        sessionResult = await res.json();
      }
      setResult(sessionResult);

      // 2. Distribution for any category (include category param for correct filtering)
      const date = sessionResult!.date;
      const distUrl = category
        ? `/api/distribution?date=${date}&userScore=${sessionResult!.totalScore}&category=${category}`
        : `/api/distribution?date=${date}&userScore=${sessionResult!.totalScore}`;
      const distRes = await fetch(distUrl, { headers: authHeader });
      if (distRes.ok) {
        const distData: DistributionResponse = await distRes.json();
        setDistribution(distData);
        setShowLinkPrompt(distData.showLinkPrompt);
      }

      // 3. Groups (Plus only; silently ignore if not Plus)
      const groupsRes = await fetch("/api/groups", { headers: authHeader });
      if (groupsRes.ok) {
        setGroups(await groupsRes.json());
      }
    }

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-lg space-y-6">
        <NavHeader />

        <div className="flex justify-end">
          <CategorySwitcher value={category} onChange={(cat) => setCategory(cat)} />
        </div>

        {error && (
          <div className="text-center py-12 space-y-3">
            <p className="font-recoleta text-xl text-ink">{error}</p>
            <a href="/" className="font-recoleta text-sm text-ink-muted underline">
              back to home
            </a>
          </div>
        )}

        {!result && !error && (
          <div className="flex flex-col items-center gap-3 py-16 font-recoleta text-ink-muted">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-gold" />
            <p className="text-sm">loading results…</p>
          </div>
        )}

        {result && (
          <ResultsCard
            result={result}
            distribution={distribution ?? null}
            groups={groups}
          />
        )}

        {showLinkPrompt && <LinkAccountPrompt />}

        {result && (
          <p className="text-center font-recoleta text-xs text-ink-muted pb-4">
            {category ? `come back tomorrow for a new ${category} puzzle` : "come back tomorrow for a new puzzle"}
          </p>
        )}
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-parchment px-4 py-8">
        <div className="mx-auto max-w-lg space-y-6">
          <NavHeader />
          <div className="flex flex-col items-center gap-3 py-16 font-recoleta text-ink-muted">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-gold" />
            <p className="text-sm">loading results…</p>
          </div>
        </div>
      </main>
    }>
      <ResultsPageInner />
    </Suspense>
  );
}
