import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { getUserPlusStatus } from "@/lib/plus";
import { MAX_SCORE_PER_EVENT } from "@/lib/scoring";
import type { ScoredGuess } from "@/types";

export const dynamic = "force-dynamic";

export interface EraAccuracy {
  era: string;          // e.g. "1000s", "1100s"
  count: number;
  avgScore: number;
}

export interface UserStats {
  totalGames: number;
  avgScore: number;
  bestScore: number;
  bestDate: string | null;
  currentStreak: number;
  longestStreak: number;
  perfectGuesses: number;
  recentScores: { date: string; score: number }[];   // last 30 games
  eraAccuracy: EraAccuracy[];
}

export async function GET(req: NextRequest) {
  const { user, error: authError } = await getUserFromRequest(req);

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { isPlus } = await getUserPlusStatus(user.id);
  if (!isPlus) {
    return NextResponse.json({ error: "Circa+ required." }, { status: 403 });
  }

  const client = createServiceClient();

  // All results for this user, newest first
  const { data: results, error: resultsError } = await client
    .from("user_results")
    .select("puzzle_date, total_score, guesses")
    .eq("user_id", user.id)
    .order("puzzle_date", { ascending: false });

  if (resultsError) {
    return NextResponse.json({ error: "Failed to load stats." }, { status: 500 });
  }

  // Streak data
  const { data: streakRow } = await client
    .from("user_streaks")
    .select("current_streak, longest_streak")
    .eq("user_id", user.id)
    .single();

  if (!results || results.length === 0) {
    const empty: UserStats = {
      totalGames: 0,
      avgScore: 0,
      bestScore: 0,
      bestDate: null,
      currentStreak: streakRow?.current_streak ?? 0,
      longestStreak: streakRow?.longest_streak ?? 0,
      perfectGuesses: 0,
      recentScores: [],
      eraAccuracy: [],
    };
    return NextResponse.json(empty);
  }

  const allScores = results.map((r: { total_score: number }) => r.total_score);
  const bestIdx = allScores.indexOf(Math.max(...allScores));

  // Perfect guesses across all games
  let perfectGuesses = 0;
  const eraBuckets = new Map<string, { total: number; count: number }>();

  for (const result of results) {
    const guesses: ScoredGuess[] = result.guesses ?? [];
    for (const g of guesses) {
      if (g.isPerfect) perfectGuesses++;

      // Group by century
      const century = Math.floor(g.correctYear / 100) * 100;
      const era = `${century}s`;
      const bucket = eraBuckets.get(era) ?? { total: 0, count: 0 };
      bucket.total += Math.min(g.score, MAX_SCORE_PER_EVENT - 10); // base score only
      bucket.count += 1;
      eraBuckets.set(era, bucket);
    }
  }

  const eraAccuracy: EraAccuracy[] = Array.from(eraBuckets.entries())
    .map(([era, { total, count }]) => ({
      era,
      count,
      avgScore: Math.round(total / count),
    }))
    .sort((a, b) => a.era.localeCompare(b.era));

  const recentScores = results
    .slice(0, 30)
    .map((r: { puzzle_date: string; total_score: number }) => ({
      date: r.puzzle_date,
      score: r.total_score,
    }))
    .reverse(); // oldest first for charting

  const stats: UserStats = {
    totalGames: results.length,
    avgScore: Math.round(allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length),
    bestScore: Math.max(...allScores),
    bestDate: results[bestIdx]?.puzzle_date ?? null,
    currentStreak: streakRow?.current_streak ?? 0,
    longestStreak: streakRow?.longest_streak ?? 0,
    perfectGuesses,
    recentScores,
    eraAccuracy,
  };

  return NextResponse.json(stats);
}
