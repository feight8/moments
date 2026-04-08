import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { todayUTC } from "@/lib/dates";
import type { DailyPuzzle, PublicEvent, DbDailyPuzzle, DbEvent } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const date = todayUTC();

  // Fetch today's puzzle
  const { data: puzzle, error: puzzleError } = await supabase
    .from("daily_puzzles")
    .select("*")
    .eq("date", date)
    .single<DbDailyPuzzle>();

  if (puzzleError || !puzzle) {
    return NextResponse.json(
      { error: "No puzzle found for today." },
      { status: 404 }
    );
  }

  // Fetch the events — explicitly omit `year` in the select
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, description, slug")
    .in("id", puzzle.event_ids);

  if (eventsError || !events) {
    return NextResponse.json(
      { error: "Failed to load today's events." },
      { status: 500 }
    );
  }

  // Preserve the order defined in daily_puzzles.event_ids
  const ordered = puzzle.event_ids
    .map((id) => (events as DbEvent[]).find((e) => e.id === id))
    .filter((e): e is DbEvent => e !== undefined)
    .map<PublicEvent>(({ id, description, slug }) => ({ id, description, slug }));

  const response: DailyPuzzle = { date, events: ordered };
  return NextResponse.json(response);
}
