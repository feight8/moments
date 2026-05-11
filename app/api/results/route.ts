import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { resolveActivePuzzleDate } from "@/lib/puzzle";
import type { SessionResult, DbUserStreak } from "@/types";
import { MAX_SCORE_PER_EVENT } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const serviceClient = createServiceClient();
  const { user, error: authError } = await getUserFromRequest(req);

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const category = req.nextUrl.searchParams.get("category") ?? null;

  // Resolve active puzzle date for the given category (null = main daily)
  const date = await resolveActivePuzzleDate(serviceClient, category);
  if (!date) {
    return NextResponse.json({ error: "No puzzle available." }, { status: 404 });
  }

  const resultQuery = serviceClient
    .from("user_results")
    .select("*")
    .eq("user_id", user.id)
    .eq("puzzle_date", date);

  const { data: result } = await (category
    ? resultQuery.eq("category", category)
    : resultQuery.is("category", null)
  ).single();

  if (!result) {
    return NextResponse.json({ error: "No result found for today." }, { status: 404 });
  }

  const { data: streakRow } = (await serviceClient
    .from("user_streaks")
    .select("current_streak")
    .eq("user_id", user.id)
    .single()) as { data: Pick<DbUserStreak, "current_streak"> | null };

  const scoredGuesses = result.guesses;
  const perfectCount = scoredGuesses.filter(
    (g: { isPerfect: boolean }) => g.isPerfect
  ).length;

  const response: SessionResult = {
    date,
    category,
    guesses: scoredGuesses,
    totalScore: result.total_score,
    maxScore: MAX_SCORE_PER_EVENT * 5,
    perfectCount,
    streak: streakRow?.current_streak ?? 0,
  };

  return NextResponse.json(response);
}
