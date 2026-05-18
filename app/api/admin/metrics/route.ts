import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { isAdminUser } from "@/lib/plus";
import { todayDate } from "@/lib/dates";
import type { DistributionBucket } from "@/app/api/distribution/route";
import type { ScoredGuess } from "@/types";

export const dynamic = "force-dynamic";

export interface PerfectsByEvent {
  eventId: string;
  slug: string;
  perfectCount: number;
}

export interface AdminMetrics {
  date: string;
  totalPlayers: number;
  topScore: number | null;
  longestActiveStreak: number;
  perfectsPerEvent: PerfectsByEvent[];
  buckets: DistributionBucket[];
}

const BUCKETS: Omit<DistributionBucket, "count">[] = [
  { label: "0–100",   min: 0,   max: 100 },
  { label: "101–200", min: 101, max: 200 },
  { label: "201–300", min: 201, max: 300 },
  { label: "301–400", min: 301, max: 400 },
  { label: "401–499", min: 401, max: 499 },
  { label: "500+",    min: 500, max: Infinity },
];

export async function GET(req: NextRequest) {
  const { user } = await getUserFromRequest(req);
  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const paramDate = new URL(req.url).searchParams.get("date");
  const puzzleDate = paramDate ?? todayDate();

  const serviceClient = createServiceClient();

  const { data: rows } = await serviceClient
    .from("user_results")
    .select("user_id, total_score, guesses")
    .eq("puzzle_date", puzzleDate)
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

  const perfectsPerEvent: PerfectsByEvent[] = [];
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

  return NextResponse.json({
    date: puzzleDate,
    totalPlayers,
    topScore,
    longestActiveStreak,
    perfectsPerEvent,
    buckets,
  } satisfies AdminMetrics);
}
