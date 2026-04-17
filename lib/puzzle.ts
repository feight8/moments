/**
 * Shared puzzle-resolution utilities used by server-side API routes.
 * Centralises the "today's puzzle or latest fallback" logic so all routes
 * stay in sync if the resolution strategy ever changes.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { todayDate } from "./dates";

/**
 * Resolves the active puzzle date: today's puzzle if it exists, otherwise
 * the most recently seeded puzzle. Returns null if no puzzles exist at all.
 *
 * Use this wherever a route needs today's puzzle date without also fetching
 * event_ids (e.g. /api/results). Routes that need the full puzzle row should
 * call this and then select the row, or replicate the two-query pattern with
 * the additional columns they need.
 */
export async function resolveActivePuzzleDate(
  client: SupabaseClient
): Promise<string | null> {
  const today = todayDate();

  const { data: todaysPuzzle } = await client
    .from("daily_puzzles")
    .select("date")
    .eq("date", today)
    .single();

  if (todaysPuzzle) return todaysPuzzle.date;

  const { data: latestPuzzle } = await client
    .from("daily_puzzles")
    .select("date")
    .order("date", { ascending: false })
    .limit(1)
    .single();

  return latestPuzzle?.date ?? null;
}
