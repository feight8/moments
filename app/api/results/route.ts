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

  // Resolve active puzzle date using shared helper (keeps in sync with /api/submit)
  const date = await resolveActivePuzzleDate(serviceClient);
  if (!date) {
    return NextResponse.json({ error: "No puzzle available." }, { status: 404 });
  }

  const { data: result } = await serviceClient
    .from("user_results")
    .select("*")
    .eq("user_id", user.id)
    .eq("puzzle_date", date)
    .single();

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
    guesses: scoredGuesses,
    totalScore: result.total_score,
    maxScore: MAX_SCORE_PER_EVENT * 5,
    perfectCount,
    streak: streakRow?.current_streak ?? 0,
  };

  return NextResponse.json(response);
}
