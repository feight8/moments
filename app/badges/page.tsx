"use client";

import { useEffect, useState } from "react";
import NavHeader from "@/components/NavHeader";
import { badgeReason } from "@/lib/badgeDisplay";
import type { Badge, UserBadge } from "@/types";

interface BadgesResponse {
  earned: UserBadge[];
  locked: Badge[];
}

function BadgeCard({ badge, earnedAt }: { badge: Badge; earnedAt?: string }) {
  const isEarned = !!earnedAt;
  return (
    <div
      className={`relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
        isEarned
          ? "border-gold/40 bg-parchment shadow-sm"
          : "border-ink/10 bg-ink/5 opacity-40 grayscale"
      }`}
    >
      {badge.iconUrl ? (
        <img src={badge.iconUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
      ) : (
        <span className="text-4xl leading-none">{badge.emoji}</span>
      )}
      <p className={`text-sm font-semibold ${isEarned ? "text-gold" : "text-ink/60"}`}>
        {badge.name}
      </p>
      <p className="text-xs text-ink/60 leading-snug">{badge.description}</p>
      <p className="text-[10px] text-ink/40 uppercase tracking-wide">{badgeReason(badge)}</p>
      {isEarned && earnedAt && (
        <p className="text-xs text-ink/40 mt-1">
          {new Date(earnedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      )}
      {!isEarned && (
        <span className="absolute top-2 right-2 text-base opacity-40">🔒</span>
      )}
    </div>
  );
}

export default function BadgesPage() {
  const [data, setData] = useState<BadgesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/badges")
      .then((r) => {
        if (!r.ok) throw new Error("Not authenticated");
        return r.json();
      })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <NavHeader backHref="/" />
      <main className="max-w-lg mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">Badges</h1>
          <p className="text-sm text-ink/60 mt-1">
            Earn badges by reaching milestones in Circa.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-500">
            {error === "Not authenticated"
              ? "Sign in to view your badges."
              : "Failed to load badges."}
          </p>
        )}

        {!data && !error && (
          <p className="text-sm text-ink/50 animate-pulse">Loading…</p>
        )}

        {data && (
          <>
            {data.earned.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50 mb-3">
                  Earned ({data.earned.length})
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {data.earned.map((ub) => (
                    <BadgeCard
                      key={ub.badge.id}
                      badge={ub.badge}
                      earnedAt={ub.earnedAt}
                    />
                  ))}
                </div>
              </section>
            )}

            {data.locked.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50 mb-3">
                  Locked ({data.locked.length})
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {data.locked.map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} />
                  ))}
                </div>
              </section>
            )}

            {data.earned.length === 0 && data.locked.length === 0 && (
              <p className="text-sm text-ink/50">No badges available yet.</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
