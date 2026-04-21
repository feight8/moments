"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ResultsCard from "@/components/ResultsCard";
import LinkAccountPrompt from "@/components/LinkAccountPrompt";
import NavHeader from "@/components/NavHeader";
import type { SessionResult, Group } from "@/types";
import type { DistributionResponse } from "@/app/api/distribution/route";

export default function ResultsPage() {
  const [result, setResult]           = useState<SessionResult | null>(null);
  const [distribution, setDistribution] = useState<DistributionResponse | null>(null);
  const [showLinkPrompt, setShowLinkPrompt] = useState(false);
  const [groups, setGroups]           = useState<Group[] | null>(null);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      // Get auth session once — used for both fetches below
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader: Record<string, string> = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {};

      // 1. Load today's result (sessionStorage first, then API)
      let sessionResult: SessionResult | null = null;
      const cached = sessionStorage.getItem("circa_result");
      if (cached) {
        try { sessionResult = JSON.parse(cached); } catch { /* fall through */ }
      }

      if (!sessionResult) {
        const res = await fetch("/api/results", { headers: authHeader });
        if (!res.ok) {
          setError("Could not load your results. Please try again.");
          return;
        }
        sessionResult = await res.json();
      }
      setResult(sessionResult);

      // 2. Fetch distribution + link-prompt flag
      const date = sessionResult!.date;

      const distRes = await fetch(`/api/distribution?date=${date}`, {
        headers: authHeader,
      });

      if (distRes.ok) {
        const distData: DistributionResponse = await distRes.json();
        setDistribution(distData);
        setShowLinkPrompt(distData.showLinkPrompt);
      }

      // 3. Fetch groups (Plus only; silently ignore if not Plus)
      const groupsRes = await fetch("/api/groups", { headers: authHeader });
      if (groupsRes.ok) {
        setGroups(await groupsRes.json());
      }
    }

    load();
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

        {result && (
          <ResultsCard
            result={result}
            distribution={distribution ?? null}
          />
        )}

        {showLinkPrompt && <LinkAccountPrompt />}

        {/* Groups section (Plus members only) */}
        {groups !== null && (
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
                    className="flex items-center justify-between rounded-2xl border border-ink/10 bg-white/60 px-5 py-4 hover:bg-white/80 transition-colors group"
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
              <div className="rounded-2xl border border-ink/10 bg-white/60 p-5 text-center space-y-2">
                <p className="font-sans text-sm text-ink-muted">play with friends and compare scores</p>
                <a href="/groups" className="font-sans text-sm font-semibold text-gold hover:text-gold/80 transition-colors">
                  create a group →
                </a>
              </div>
            )}
          </section>
        )}

        {result && (
          <p className="text-center font-sans text-xs text-ink-muted pb-4">
            come back tomorrow for a new puzzle
          </p>
        )}
      </div>
    </main>
  );
}
