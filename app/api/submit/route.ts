import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { scoreGuess, isPerfect, MAX_SCORE_PER_EVENT } from "@/lib/scoring";
import { todayUTC } from "@/lib/dates";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Guess, ScoredGuess, SessionResult, DbEvent, DbUserStreak } from "@/types";

export const dynamic = "force-dynamic";

interface SubmitBody {
  guesses: Guess[];
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const serviceClient = createServiceClient();

  // Authenticate — anonymous sessions are valid
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Parse and validate body
  let body: SubmitBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { guesses } = body;

  if (!Array.isArray(guesses) || guesses.length !== 5) {
    return NextResponse.json(
      { error: "Exactly 5 guesses are required." },
      { status: 400 }
    );
  }

  const date = todayUTC();

  // Idempotency check — return existing result if already submitted today
  const { data: existing } = await serviceClient
    .from("user_results")
    .select("*")
    .eq("user_id", user.id)
    .eq("puzzle_date", date)
    .single();

  if (existing) {
    return buildResultResponse(existing.guesses, existing.total_score, date, user.id, serviceClient);
  }

  // Fetch today's puzzle to get correct event order and IDs
  const { data: puzzle } = await serviceClient
    .from("daily_puzzles")
    .select("event_ids")
    .eq("date", date)
    .single();

  if (!puzzle) {
    return NextResponse.json({ error: "No puzzle for today." }, { status: 404 });
  }

  // Validate all guess event IDs belong to today's puzzle
  const validIds = new Set<string>(puzzle.event_ids);
  for (const g of guesses) {
    if (!validIds.has(g.eventId)) {
      return NextResponse.json(
        { error: `Invalid event ID: ${g.eventId}` },
        { status: 400 }
      );
    }
    if (!Number.isInteger(g.guessYear) || g.guessYear < 1 || g.guessYear > 2025) {
      return NextResponse.json(
        { error: `Guess year out of range: ${g.guessYear}` },
        { status: 400 }
      );
    }
  }

  // Fetch correct years (server-side only)
  const { data: events } = await serviceClient
    .from("events")
    .select("id, description, year")
    .in("id", puzzle.event_ids);

  if (!events) {
    return NextResponse.json({ error: "Failed to load events." }, { status: 500 });
  }

  const eventMap = new Map<string, DbEvent>(
    (events as DbEvent[]).map((e) => [e.id, e])
  );

  // Score each guess
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
    };
  });

  const totalScore = scoredGuesses.reduce((sum, g) => sum + g.score, 0);

  // Persist result
  await serviceClient.from("user_results").insert({
    user_id: user.id,
    puzzle_date: date,
    guesses: scoredGuesses,
    total_score: totalScore,
  });

  // Update streak
  await updateStreak(user.id, date, serviceClient);

  return buildResultResponse(scoredGuesses, totalScore, date, user.id, serviceClient);
}

async function updateStreak(
  userId: string,
  date: string,
  client: SupabaseClient
) {
  const { data: streakRow } = (await client
    .from("user_streaks")
    .select("*")
    .eq("user_id", userId)
    .single()) as { data: DbUserStreak | null };

  const yesterday = new Date(date);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let newStreak = 1;
  let longestStreak = 1;

  if (streakRow) {
    if (streakRow.last_completed_date === yesterdayStr) {
      newStreak = streakRow.current_streak + 1;
    } else if (streakRow.last_completed_date === date) {
      // Already counted today
      return;
    }
    longestStreak = Math.max(streakRow.longest_streak, newStreak);
  }

  await client.from("user_streaks").upsert({
    user_id: userId,
    current_streak: newStreak,
    longest_streak: longestStreak,
    last_completed_date: date,
    updated_at: new Date().toISOString(),
  });
}

async function buildResultResponse(
  scoredGuesses: ScoredGuess[],
  totalScore: number,
  date: string,
  userId: string,
  client: SupabaseClient
): Promise<NextResponse> {
  const { data: streakRow } = (await client
    .from("user_streaks")
    .select("current_streak")
    .eq("user_id", userId)
    .single()) as { data: Pick<DbUserStreak, "current_streak"> | null };

  const perfectCount = scoredGuesses.filter((g) => g.isPerfect).length;
  const maxScore = MAX_SCORE_PER_EVENT * 5;

  const result: SessionResult = {
    date,
    guesses: scoredGuesses,
    totalScore,
    maxScore,
    perfectCount,
    streak: streakRow?.current_streak ?? 0,
  };

  return NextResponse.json(result);
}
