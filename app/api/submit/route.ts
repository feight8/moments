import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { getUserPlusStatus, consumeStreakShield, isAdminUser } from "@/lib/plus";
import { scoreGuess, isPerfect, MAX_SCORE_PER_EVENT, YEAR_MIN, YEAR_MAX } from "@/lib/scoring";
import { todayDate } from "@/lib/dates";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Guess, ScoredGuess, SessionResult, DbEvent, DbUserStreak } from "@/types";

export const dynamic = "force-dynamic";

interface SubmitBody {
  guesses: Guess[];
  puzzleDate?: string; // YYYY-MM-DD; provided for archive play
}

export async function POST(req: NextRequest) {
  const serviceClient = createServiceClient();
  const { user, error: authError } = await getUserFromRequest(req);

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: SubmitBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { guesses, puzzleDate } = body;

  if (!Array.isArray(guesses) || guesses.length !== 5) {
    console.error("[submit] bad guess count:", guesses?.length ?? "not an array", "user:", user.id);
    return NextResponse.json(
      { error: "Exactly 5 guesses are required." },
      { status: 400 }
    );
  }

  // Resolve Plus status once — used for archive gate and streak shield
  const { isPlus } = await getUserPlusStatus(user.id);

  // Past dates require Plus; future dates require admin access.
  const todayStr = todayDate();
  if (puzzleDate && puzzleDate !== todayStr) {
    if (puzzleDate > todayStr) {
      if (!isAdminUser(user.id)) {
        return NextResponse.json({ error: "Not found." }, { status: 404 });
      }
    } else if (!isPlus) {
      return NextResponse.json({ error: "Circa+ required." }, { status: 403 });
    }
  }

  // Resolve the active puzzle
  let puzzle: { event_ids: string[]; date: string } | null = null;

  if (puzzleDate) {
    const { data } = await serviceClient
      .from("daily_puzzles")
      .select("event_ids, date")
      .eq("date", puzzleDate)
      .single();
    puzzle = data ?? null;
  } else {
    const { data: todaysPuzzle } = await serviceClient
      .from("daily_puzzles")
      .select("event_ids, date")
      .eq("date", todayStr)
      .single();

    if (todaysPuzzle) {
      puzzle = todaysPuzzle;
    } else {
      const { data: latestPuzzle } = await serviceClient
        .from("daily_puzzles")
        .select("event_ids, date")
        .order("date", { ascending: false })
        .limit(1)
        .single();
      puzzle = latestPuzzle ?? null;
    }
  }

  if (!puzzle) {
    return NextResponse.json({ error: "No puzzle available." }, { status: 404 });
  }

  // Use the puzzle's own date as the idempotency key so dev fallback works.
  const date = puzzle.date;

  // Idempotency — return existing result if already submitted for this puzzle
  const { data: existing } = await serviceClient
    .from("user_results")
    .select("*")
    .eq("user_id", user.id)
    .eq("puzzle_date", date)
    .single();

  if (existing) {
    // Already submitted — fetch streak and return existing result
    const { data: streakRow } = (await serviceClient
      .from("user_streaks")
      .select("current_streak")
      .eq("user_id", user.id)
      .single()) as { data: Pick<DbUserStreak, "current_streak"> | null };
    return buildResultResponse(existing.guesses, existing.total_score, date, streakRow?.current_streak ?? 0);
  }

  const validIds = new Set<string>(puzzle.event_ids);
  for (const g of guesses) {
    if (!validIds.has(g.eventId)) {
      return NextResponse.json({ error: `Invalid event ID: ${g.eventId}` }, { status: 400 });
    }
    if (!Number.isInteger(g.guessYear) || g.guessYear < YEAR_MIN || g.guessYear > YEAR_MAX) {
      return NextResponse.json({ error: `Guess year out of range: ${g.guessYear}` }, { status: 400 });
    }
  }

  // Fetch correct years and all reveal data
  const { data: events } = await serviceClient
    .from("events")
    .select("id, description, year, image_url, reveal_image_url, additional_context")
    .in("id", puzzle.event_ids);

  if (!events) {
    return NextResponse.json({ error: "Failed to load events." }, { status: 500 });
  }

  const eventMap = new Map<string, DbEvent>(
    (events as DbEvent[]).map((e) => [e.id, e])
  );

  const scoredGuesses: ScoredGuess[] = (puzzle.event_ids as string[]).map((eventId: string) => {
    const guess = guesses.find((g) => g.eventId === eventId)!;
    const event = eventMap.get(eventId)!;
    const score = scoreGuess(guess.guessYear, event.year);
    return {
      eventId,
      guessYear: guess.guessYear,
      correctYear: event.year,
      score,
      isPerfect: isPerfect(guess.guessYear, event.year),
      description: event.description,
      imageUrl: event.image_url,
      additionalContext: event.additional_context,
      revealImageUrl: event.reveal_image_url,
    };
  });

  const totalScore = scoredGuesses.reduce((sum, g) => sum + g.score, 0);

  const { error: insertError } = await serviceClient.from("user_results").insert({
    user_id: user.id,
    puzzle_date: date,
    guesses: scoredGuesses,
    total_score: totalScore,
  });

  if (insertError) {
    console.error("[submit] insert failed:", insertError.message, insertError.code);
    return NextResponse.json({ error: "Failed to save results. Please try again." }, { status: 500 });
  }

  const newStreak = await updateStreak(user.id, date, isPlus, serviceClient);

  return buildResultResponse(scoredGuesses, totalScore, date, newStreak);
}

/** Returns the new current streak count after updating. */
async function updateStreak(userId: string, date: string, isPlus: boolean, client: SupabaseClient): Promise<number> {
  const { data: streakRow } = (await client
    .from("user_streaks")
    .select("*")
    .eq("user_id", userId)
    .single()) as { data: DbUserStreak | null };

  const yesterday = new Date(date);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // Already submitted today — idempotent, return existing streak
  if (streakRow?.last_completed_date === date) return streakRow.current_streak;

  let newStreak = 1;
  let longestStreak = streakRow?.longest_streak ?? 1;

  if (streakRow) {
    if (streakRow.last_completed_date === yesterdayStr) {
      newStreak = streakRow.current_streak + 1;
    } else if (streakRow.current_streak > 0 && isPlus) {
      const shieldUsed = await consumeStreakShield(userId, date);
      newStreak = shieldUsed ? streakRow.current_streak + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, newStreak);
  }

  const { error: upsertError } = await client.from("user_streaks").upsert({
    user_id: userId,
    current_streak: newStreak,
    longest_streak: longestStreak,
    last_completed_date: date,
    updated_at: new Date().toISOString(),
  });

  if (upsertError) {
    console.error("[streak] upsert failed for user", userId, ":", upsertError.message);
  }

  return newStreak;
}

function buildResultResponse(
  scoredGuesses: ScoredGuess[],
  totalScore: number,
  date: string,
  streak: number
): NextResponse {
  const perfectCount = scoredGuesses.filter((g) => g.isPerfect).length;

  const result: SessionResult = {
    date,
    guesses: scoredGuesses,
    totalScore,
    maxScore: MAX_SCORE_PER_EVENT * 5,
    perfectCount,
    streak,
  };

  return NextResponse.json(result);
}
