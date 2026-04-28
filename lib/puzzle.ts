/**
 * Shared puzzle-resolution utilities used by server-side API routes.
 * Centralises the "today's puzzle or latest fallback" logic so all routes
 * stay in sync if the resolution strategy ever changes.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { todayDate } from "./dates";

/**
 * Resolves the active puzzle date for a given category (null = main daily).
 * Returns today's puzzle date if it exists, otherwise the most recently
 * seeded puzzle for that category. Returns null if no puzzles exist.
 */
export async function resolveActivePuzzleDate(
  client: SupabaseClient,
  category: string | null = null
): Promise<string | null> {
  const today = todayDate();

  if (category) {
    const { data: todaysPuzzle } = await client
      .from("daily_puzzles")
      .select("date")
      .eq("date", today)
      .eq("category", category)
      .single();
    if (todaysPuzzle) return todaysPuzzle.date;

    const { data: latestPuzzle } = await client
      .from("daily_puzzles")
      .select("date")
      .eq("category", category)
      .order("date", { ascending: false })
      .limit(1)
      .single();
    return latestPuzzle?.date ?? null;
  }

  // Main puzzle (category IS NULL)
  const { data: todaysPuzzle } = await client
    .from("daily_puzzles")
    .select("date")
    .eq("date", today)
    .is("category", null)
    .single();
  if (todaysPuzzle) return todaysPuzzle.date;

  const { data: latestPuzzle } = await client
    .from("daily_puzzles")
    .select("date")
    .is("category", null)
    .order("date", { ascending: false })
    .limit(1)
    .single();
  return latestPuzzle?.date ?? null;
}
