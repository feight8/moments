import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { getUserPlusStatus } from "@/lib/plus";
import { todayUTC } from "@/lib/dates";
import type { DailyPuzzle, PublicEvent, DbDailyPuzzle, DbEvent } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const requestedDate = req.nextUrl.searchParams.get("date");
  const today = todayUTC();

  // Archive requests (past dates) require Plus
  if (requestedDate && requestedDate < today) {
    const { user } = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    const { isPlus } = await getUserPlusStatus(user.id);
    if (!isPlus) {
      return NextResponse.json({ error: "Circa+ required to play archive puzzles." }, { status: 403 });
    }
  }

  // Determine which puzzle to serve
  let puzzle: DbDailyPuzzle | null = null;
  const client = requestedDate ? createServiceClient() : supabase;

  if (requestedDate) {
    // Explicit date requested (archive play)
    const { data } = await client
      .from("daily_puzzles")
      .select("*")
      .eq("date", requestedDate)
      .single<DbDailyPuzzle>();
    puzzle = data ?? null;

    if (!puzzle) {
      return NextResponse.json({ error: "No puzzle found for that date." }, { status: 404 });
    }
  } else {
    // Today's puzzle with dev fallback
    const { data: todaysPuzzle } = await client
      .from("daily_puzzles")
      .select("*")
      .eq("date", today)
      .single<DbDailyPuzzle>();

    if (todaysPuzzle) {
      puzzle = todaysPuzzle;
    } else {
      const { data: latestPuzzle } = await client
        .from("daily_puzzles")
        .select("*")
        .order("date", { ascending: false })
        .limit(1)
        .single<DbDailyPuzzle>();
      puzzle = latestPuzzle ?? null;
    }
  }

  if (!puzzle) {
    return NextResponse.json(
      { error: "No puzzle found. Please seed one in daily_puzzles." },
      { status: 404 }
    );
  }

  // Explicitly omit year, reveal_image_url, and additional_context
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, description, slug, image_url")
    .in("id", puzzle.event_ids);

  if (eventsError || !events) {
    return NextResponse.json(
      { error: "Failed to load today's events." },
      { status: 500 }
    );
  }

  const ordered = (puzzle.event_ids as string[])
    .map((id) => (events as DbEvent[]).find((e) => e.id === id))
    .filter((e): e is DbEvent => e !== undefined)
    .map<PublicEvent>(({ id, description, slug, image_url }) => ({
      id,
      description,
      slug,
      imageUrl: image_url,
    }));

  const response: DailyPuzzle = { date: puzzle.date, events: ordered };
  return NextResponse.json(response);
}
