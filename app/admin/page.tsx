import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/plus";
import { todayDate, formatPuzzleDate } from "@/lib/dates";
import ScoreDistribution from "@/components/ScoreDistribution";
import type { DistributionBucket } from "@/app/api/distribution/route";
import type { ScoredGuess } from "@/types";

const BUCKETS: Omit<DistributionBucket, "count">[] = [
  { label: "0–100",   min: 0,   max: 100 },
  { label: "101–200", min: 101, max: 200 },
  { label: "201–300", min: 201, max: 300 },
  { label: "301–400", min: 301, max: 400 },
  { label: "401–499", min: 401, max: 499 },
  { label: "500+",    min: 500, max: Infinity },
];

function offsetDate(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

function formatSlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b(1\d{3}|20[01]\d|202[0-5])\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user.id)) redirect("/");

  const date = typeof searchParams.date === "string" ? searchParams.date : todayDate();
  const prevDate = offsetDate(date, -1);
  const nextDate = offsetDate(date, 1);

  const serviceClient = createServiceClient();

  const { data: rows } = await serviceClient
    .from("user_results")
    .select("user_id, total_score, guesses")
    .eq("puzzle_date", date)
    .is("category", null);

  const results = (rows ?? []) as { user_id: string; total_score: number; guesses: ScoredGuess[] }[];
  const totalPlayers = results.length;

  const topScore = totalPlayers > 0
    ? Math.max(...results.map((r) => r.total_score))
    : null;

  const buckets: DistributionBucket[] = BUCKETS.map((b) => ({
    ...b,
    count: results.filter((r) => r.total_score >= b.min && r.total_score <= b.max).length,
  }));

  let longestActiveStreak = 0;
  if (totalPlayers > 0) {
    const userIds = results.map((r) => r.user_id);
    const { data: streakRows } = await serviceClient
      .from("user_streaks")
      .select("current_streak")
      .in("user_id", userIds);
    const streaks = (streakRows ?? []).map((s: { current_streak: number }) => s.current_streak);
    if (streaks.length > 0) longestActiveStreak = Math.max(...streaks);
  }

  type EventPerfect = { eventId: string; slug: string; perfectCount: number };
  const perfectsPerEvent: EventPerfect[] = [];

  if (totalPlayers > 0) {
    const firstGuesses = results[0].guesses;
    const eventOrder = firstGuesses.map((g) => g.eventId);
    const perfectCounts = new Map<string, number>(eventOrder.map((id) => [id, 0]));

    for (const result of results) {
      for (const g of result.guesses) {
        if (g.isPerfect && perfectCounts.has(g.eventId)) {
          perfectCounts.set(g.eventId, (perfectCounts.get(g.eventId) ?? 0) + 1);
        }
      }
    }

    const { data: eventRows } = await serviceClient
      .from("events")
      .select("id, slug")
      .in("id", eventOrder);

    const slugMap = new Map(
      (eventRows ?? []).map((e: { id: string; slug: string }) => [e.id, e.slug])
    );

    for (const eventId of eventOrder) {
      perfectsPerEvent.push({
        eventId,
        slug: slugMap.get(eventId) ?? eventId,
        perfectCount: perfectCounts.get(eventId) ?? 0,
      });
    }
  }

  return (
    <main className="min-h-screen bg-parchment px-4 py-6">
      <div className="mx-auto max-w-sm space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href={`/admin?date=${prevDate}`}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 bg-surface/60 font-recoleta text-sm text-ink-muted hover:text-ink transition-colors"
          >
            ←
          </Link>
          <div className="text-center">
            <p className="font-recoleta text-[10px] font-semibold uppercase tracking-widest text-ink-muted">
              circa
            </p>
            <p className="font-recoleta text-sm font-semibold text-ink">
              {formatPuzzleDate(date)}
            </p>
          </div>
          <Link
            href={`/admin?date=${nextDate}`}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 bg-surface/60 font-recoleta text-sm text-ink-muted hover:text-ink transition-colors"
          >
            →
          </Link>
        </div>

        {totalPlayers === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-surface/60 px-5 py-10 text-center backdrop-blur-sm">
            <p className="font-recoleta text-sm text-ink-muted">no results yet</p>
          </div>
        ) : (
          <>
            {/* Score distribution */}
            <ScoreDistribution buckets={buckets} totalPlayers={totalPlayers} />

            {/* Key stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-ink/10 bg-surface/60 p-4 text-center backdrop-blur-sm">
                <p className="font-recoleta text-[10px] font-semibold uppercase tracking-widest text-ink-muted mb-1">
                  top score
                </p>
                <p className="font-recoleta text-2xl font-bold text-teal">
                  {topScore}
                </p>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-surface/60 p-4 text-center backdrop-blur-sm">
                <p className="font-recoleta text-[10px] font-semibold uppercase tracking-widest text-ink-muted mb-1">
                  best streak
                </p>
                <p className="font-recoleta text-2xl font-bold text-teal">
                  {longestActiveStreak}
                  <span className="font-recoleta text-xs font-normal text-ink-muted ml-1">days</span>
                </p>
              </div>
            </div>

            {/* Perfects by event */}
            <div>
              <p className="font-recoleta text-xs font-semibold uppercase tracking-widest text-ink-muted mb-3">
                💎 perfects by event
              </p>
              <div className="rounded-2xl border border-ink/10 bg-surface/60 divide-y divide-ink/8 backdrop-blur-sm overflow-hidden">
                {perfectsPerEvent.map(({ eventId, slug, perfectCount }) => (
                  <div key={eventId} className="flex items-center justify-between px-4 py-2.5">
                    <p className="font-recoleta text-sm text-ink">{formatSlug(slug)}</p>
                    <p className="font-recoleta text-sm font-semibold text-teal tabular-nums">
                      {perfectCount}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </main>
  );
}
