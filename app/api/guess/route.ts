import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { getUserPlusStatus, isAdminUser } from "@/lib/plus";
import { scoreGuess, isPerfect, YEAR_MIN, YEAR_MAX } from "@/lib/scoring";
import { todayDate } from "@/lib/dates";
import type { GuessResult, DbEvent, DbDailyPuzzle } from "@/types";

export const dynamic = "force-dynamic";

interface GuessBody {
  eventId: string;
  guessYear: number;
  puzzleDate?: string; // YYYY-MM-DD; provided for archive play
  category?: string | null;
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

  const { eventId, guessYear, puzzleDate, category = null } = body;

  if (!eventId || !Number.isInteger(guessYear) || guessYear < YEAR_MIN || guessYear > YEAR_MAX) {
    return NextResponse.json({ error: "Invalid guess." }, { status: 400 });
  }

  // Past dates require Plus; future dates require admin access.
  const todayStr = todayDate();
  if (puzzleDate && puzzleDate !== todayStr) {
    if (puzzleDate > todayStr) {
      if (!isAdminUser(user.id)) {
        return NextResponse.json({ error: "Not found." }, { status: 404 });
      }
    } else {
      const { isPlus } = await getUserPlusStatus(user.id);
      if (!isPlus) {
        return NextResponse.json({ error: "Circa+ required." }, { status: 403 });
      }
    }
  }

  // Resolve the puzzle, matching on category
  let puzzle: DbDailyPuzzle | null = null;

  if (puzzleDate) {
    const { data } = await (category
      ? serviceClient.from("daily_puzzles").select("*").eq("date", puzzleDate).eq("category", category)
      : serviceClient.from("daily_puzzles").select("*").eq("date", puzzleDate).is("category", null)
    ).single<DbDailyPuzzle>();
    puzzle = data ?? null;
  } else {
    const { data: todaysPuzzle } = await (category
      ? serviceClient.from("daily_puzzles").select("*").eq("date", todayStr).eq("category", category)
      : serviceClient.from("daily_puzzles").select("*").eq("date", todayStr).is("category", null)
    ).single<DbDailyPuzzle>();

    if (todaysPuzzle) {
      puzzle = todaysPuzzle;
    } else {
      const { data: latestPuzzle } = await (category
        ? serviceClient.from("daily_puzzles").select("*").eq("category", category).order("date", { ascending: false }).limit(1)
        : serviceClient.from("daily_puzzles").select("*").is("category", null).order("date", { ascending: false }).limit(1)
      ).single<DbDailyPuzzle>();
      puzzle = latestPuzzle ?? null;
    }
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
