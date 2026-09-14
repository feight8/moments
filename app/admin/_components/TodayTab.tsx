import { createServiceClient } from "@/lib/supabase/server";
import { formatPuzzleDate } from "@/lib/dates";
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

const CATEGORY_LABELS: Record<string, string> = {
  "sports":      "sports",
  "pop-culture": "pop culture",
};

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

interface Props {
  date: string;
  category: string | null;
}

export default async function TodayTab({ date, category }: Props) {
  const serviceClient = createServiceClient();
  const prevDate = offsetDate(date, -1);
  const nextDate = offsetDate(date, 1);
  const catParam = category ? `&category=${category}` : "";
  const categoryLabel = category ? (CATEGORY_LABELS[category] ?? category) : "daily";

  // Today's results
  const q = serviceClient
    .from("user_results")
    .select("user_id, total_score, guesses")
    .eq("puzzle_date", date);
  const { data: rows } = await (category ? q.eq("category", category) : q.is("category", null));
  const results = (rows ?? []) as { user_id: string; total_score: number; guesses: ScoredGuess[] }[];
  const totalPlayers = results.length;

  // Yesterday's count for delta
  const yq = serviceClient
    .from("user_results")
    .select("user_id", { count: "exact", head: true })
    .eq("puzzle_date", prevDate);
  const { count: yesterdayCount } = await (category ? yq.eq("category", category) : yq.is("category", null));

  // 7-day sparkline
  const sparkDates = Array.from({ length: 7 }, (_, i) => offsetDate(date, -(6 - i)));
  const sparkQ = serviceClient
    .from("user_results")
    .select("puzzle_date")
    .in("puzzle_date", sparkDates);
  const { data: sparkRows } = await (category ? sparkQ.eq("category", category) : sparkQ.is("category", null));
  const sparkCounts = sparkDates.map((d) => ({
    date: d,
    count: (sparkRows ?? []).filter((r: { puzzle_date: string }) => r.puzzle_date === d).length,
  }));
  const sparkMax = Math.max(...sparkCounts.map((s) => s.count), 1);

  const topScore = totalPlayers > 0 ? Math.max(...results.map((r) => r.total_score)) : null;
  const avgScore = totalPlayers > 0
    ? Math.round(results.reduce((s, r) => s + r.total_score, 0) / totalPlayers)
    : null;

  const buckets: DistributionBucket[] = BUCKETS.map((b) => ({
    ...b,
    count: results.filter((r) => r.total_score >= b.min && r.total_score <= b.max).length,
  }));

  // Longest active streak among today's players
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

  // Perfects per event
  type EventPerfect = { eventId: string; slug: string; perfectCount: number };
  const perfectsPerEvent: EventPerfect[] = [];
  if (totalPlayers > 0) {
    const eventOrder = results[0].guesses.map((g) => g.eventId);
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

  const delta =
    yesterdayCount !== null && yesterdayCount > 0
      ? Math.round(((totalPlayers - yesterdayCount) / yesterdayCount) * 100)
      : null;

  return (
    <div className="space-y-4">
      {/* Date nav */}
      <div className="flex items-center justify-between">
        <a
          href={`/admin?tab=today&date=${prevDate}${catParam}`}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 bg-surface/60 font-recoleta text-sm text-ink-muted hover:text-ink transition-colors"
        >
          ←
        </a>
        <div className="text-center">
          <p className="font-recoleta text-[10px] font-semibold uppercase tracking-widest text-ink-muted">
            {categoryLabel}
          </p>
          <p className="font-recoleta text-sm font-semibold text-ink">{formatPuzzleDate(date)}</p>
        </div>
        <a
          href={`/admin?tab=today&date=${nextDate}${catParam}`}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 bg-surface/60 font-recoleta text-sm text-ink-muted hover:text-ink transition-colors"
        >
          →
        </a>
      </div>

      {/* Category picker */}
      <div className="flex gap-1.5 flex-wrap">
        {([null, "sports", "pop-culture"] as (string | null)[]).map((cat) => {
          const isActive = category === cat;
          const label = cat === null ? "daily" : (CATEGORY_LABELS[cat] ?? cat);
          return (
            <a
              key={cat ?? "daily"}
              href={`/admin?tab=today&date=${date}${cat ? `&category=${cat}` : ""}`}
              className={`rounded-full px-3 py-1 font-recoleta text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-gold text-white"
                  : "bg-surface/60 border border-ink/10 text-ink-muted hover:text-ink"
              }`}
            >
              {label}
            </a>
          );
        })}
      </div>

      {/* 7-day sparkline */}
      <div className="rounded-2xl border border-ink/10 bg-surface/60 px-4 pt-4 pb-3 backdrop-blur-sm">
        <p className="font-recoleta text-[10px] font-semibold uppercase tracking-widest text-ink-muted mb-3">
          7-day players
        </p>
        <div className="flex items-end gap-1 h-10">
          {sparkCounts.map(({ date: d, count }) => {
            const heightPct = Math.max(Math.round((count / sparkMax) * 100), count > 0 ? 8 : 0);
            const isSelected = d === date;
            return (
              <a
                key={d}
                href={`/admin?tab=today&date=${d}${catParam}`}
                className="flex-1 flex flex-col items-center gap-0.5 group"
              >
                <div
                  className={`w-full rounded-sm transition-all ${isSelected ? "bg-gold" : "bg-ink/15 group-hover:bg-ink/25"}`}
                  style={{ height: `${heightPct}%`, minHeight: count > 0 ? "3px" : "0" }}
                />
                <p className="font-recoleta text-[8px] text-ink-muted tabular-nums leading-none">
                  {count}
                </p>
              </a>
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <p className="font-recoleta text-[8px] text-ink-muted/50">6 days ago</p>
          <p className="font-recoleta text-[8px] text-ink-muted/50">selected</p>
        </div>
      </div>

      {totalPlayers === 0 ? (
        <div className="rounded-2xl border border-ink/10 bg-surface/60 px-5 py-10 text-center backdrop-blur-sm">
          <p className="font-recoleta text-sm text-ink-muted">no results yet</p>
          <p className="font-recoleta text-xs text-ink-muted/60 mt-1">
            {categoryLabel} · {formatPuzzleDate(date)}
          </p>
        </div>
      ) : (
        <>
          {/* Score distribution */}
          <ScoreDistribution
            buckets={buckets}
            totalPlayers={totalPlayers}
            branded
            showPercentage
            showPlayerCount={false}
          />

          {/* Key stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-ink/10 bg-surface/60 p-4 text-center backdrop-blur-sm">
              <p className="font-recoleta text-[10px] font-semibold uppercase tracking-widest text-ink-muted mb-1">
                players
              </p>
              <p className="font-recoleta text-2xl font-bold text-teal dark:text-ink">
                {totalPlayers}
              </p>
              {delta !== null && (
                <p className={`font-recoleta text-[9px] mt-0.5 ${delta >= 0 ? "text-green-500" : "text-red-400"}`}>
                  {delta >= 0 ? "↑" : "↓"}{Math.abs(delta)}% yday
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-ink/10 bg-surface/60 p-4 text-center backdrop-blur-sm">
              <p className="font-recoleta text-[10px] font-semibold uppercase tracking-widest text-ink-muted mb-1">
                top score
              </p>
              <p className="font-recoleta text-2xl font-bold text-teal dark:text-ink">
                {topScore}
              </p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-surface/60 p-4 text-center backdrop-blur-sm">
              <p className="font-recoleta text-[10px] font-semibold uppercase tracking-widest text-ink-muted mb-1">
                avg score
              </p>
              <p className="font-recoleta text-2xl font-bold text-teal dark:text-ink">
                {avgScore}
              </p>
            </div>
          </div>

          {/* Best active streak */}
          <div className="rounded-2xl border border-ink/10 bg-surface/60 p-4 text-center backdrop-blur-sm">
            <p className="font-recoleta text-[10px] font-semibold uppercase tracking-widest text-ink-muted mb-1">
              longest active streak (today&apos;s players)
            </p>
            <p className="font-recoleta text-2xl font-bold text-teal dark:text-ink">
              {longestActiveStreak}
              <span className="font-recoleta text-xs font-normal text-ink-muted ml-1">days</span>
            </p>
          </div>

          {/* Perfects per event */}
          <div>
            <p className="font-recoleta text-xs font-semibold uppercase tracking-widest text-ink-muted mb-3">
              💎 perfects by event
            </p>
            <div className="rounded-2xl border border-ink/10 bg-surface/60 divide-y divide-ink/8 backdrop-blur-sm overflow-hidden">
              {perfectsPerEvent.map(({ eventId, slug, perfectCount }) => (
                <div key={eventId} className="flex items-center justify-between px-4 py-2.5">
                  <p className="font-recoleta text-sm text-ink">{formatSlug(slug)}</p>
                  <p className="font-recoleta text-sm font-semibold text-teal dark:text-ink tabular-nums">
                    {perfectCount}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
