import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { scoreGuess, isPerfect } from "@/lib/scoring";
import { todayUTC } from "@/lib/dates";
import type { GuessResult, DbEvent, DbDailyPuzzle } from "@/types";

export const dynamic = "force-dynamic";

interface GuessBody {
  eventId: string;
  guessYear: number;
}

export async function POST(req: NextRequest) {
  const serviceClient = createServiceClient();
  const { user, error: authError } = await getUserFromRequest(req);

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: GuessBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { eventId, guessYear } = body;

  if (!eventId || !Number.isInteger(guessYear) || guessYear < 1000 || guessYear > 2025) {
    return NextResponse.json({ error: "Invalid guess." }, { status: 400 });
  }

  // Resolve the active puzzle with the same fallback logic as /api/daily
  let puzzle: DbDailyPuzzle | null = null;
  const todayStr = todayUTC();

  const { data: todaysPuzzle } = await serviceClient
    .from("daily_puzzles")
    .select("*")
    .eq("date", todayStr)
    .single<DbDailyPuzzle>();

  if (todaysPuzzle) {
    puzzle = todaysPuzzle;
  } else {
    const { data: latestPuzzle } = await serviceClient
      .from("daily_puzzles")
      .select("*")
      .order("date", { ascending: false })
      .limit(1)
      .single<DbDailyPuzzle>();
    puzzle = latestPuzzle ?? null;
  }

  if (!puzzle || !(puzzle.event_ids as string[]).includes(eventId)) {
    return NextResponse.json({ error: "Event not in today's puzzle." }, { status: 400 });
  }

  // Fetch the event including the correct year and reveal details
  const { data: event } = await serviceClient
    .from("events")
    .select("id, year, additional_context, reveal_image_url")
    .eq("id", eventId)
    .single<Pick<DbEvent, "id" | "year" | "additional_context" | "reveal_image_url">>();

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const score = scoreGuess(guessYear, event.year);
  const perfect = isPerfect(guessYear, event.year);

  const result: GuessResult = {
    eventId,
    guessYear,
    correctYear: event.year,
    score,
    isPerfect: perfect,
    additionalContext: event.additional_context,
    revealImageUrl: event.reveal_image_url,
  };

  return NextResponse.json(result);
}
