import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { todayUTC } from "@/lib/dates";
import type { DailyPuzzle, PublicEvent, DbDailyPuzzle, DbEvent } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const date = todayUTC();

  // Try today's puzzle first; fall back to the most recently seeded puzzle.
  // This keeps development working without needing a puzzle seeded for every
  // calendar day. Remove the fallback query before launch.
  let puzzle: DbDailyPuzzle | null = null;

  const { data: todaysPuzzle } = await supabase
    .from("daily_puzzles")
    .select("*")
    .eq("date", date)
    .single<DbDailyPuzzle>();

  if (todaysPuzzle) {
    puzzle = todaysPuzzle;
  } else {
    const { data: latestPuzzle } = await supabase
      .from("daily_puzzles")
      .select("*")
      .order("date", { ascending: false })
      .limit(1)
      .single<DbDailyPuzzle>();
    puzzle = latestPuzzle ?? null;
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

  const response: DailyPuzzle = { date, events: ordered };
  return NextResponse.json(response);
}
