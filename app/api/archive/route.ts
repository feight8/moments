import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { getUserPlusStatus } from "@/lib/plus";
import { todayDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export interface ArchivePuzzleEntry {
  category: string | null;
  label: string;
  played: boolean;
  totalScore: number | null;
}

export interface ArchiveEntry {
  date: string;
  puzzles: ArchivePuzzleEntry[];
  playedCount: number;
  totalCount: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  "sports":      "sports",
  "pop-culture": "pop culture",
  "science":     "science",
  "arts":        "arts & culture",
  "politics":    "politics",
};

export async function GET(req: NextRequest) {
  const { user, error: authError } = await getUserFromRequest(req);

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { isPlus } = await getUserPlusStatus(user.id);
  if (!isPlus) {
    return NextResponse.json({ error: "Circa+ required." }, { status: 403 });
  }

  const client = createServiceClient();
  const today = todayDate();

  // All past puzzle rows — main daily (category IS NULL) and category puzzles
  // Ordered date desc, then nulls-first so main daily leads within each date
  const { data: puzzles, error } = await client
    .from("daily_puzzles")
    .select("date, category")
    .lt("date", today)
    .order("date", { ascending: false })
    .order("category", { ascending: true, nullsFirst: true });

  if (error || !puzzles) {
    return NextResponse.json({ error: "Failed to load archive." }, { status: 500 });
  }

  if (puzzles.length === 0) {
    return NextResponse.json([]);
  }

  const dates = [...new Set(puzzles.map((p: { date: string }) => p.date))];

  // Fetch all of this user's results for these dates (main + category)
  const { data: results } = await client
    .from("user_results")
    .select("puzzle_date, category, total_score")
    .eq("user_id", user.id)
    .in("puzzle_date", dates);

  // Build result lookup keyed by "date|category" (category="" for main daily)
  const resultMap = new Map<string, number>();
  for (const r of results ?? []) {
    const key = `${r.puzzle_date}|${r.category ?? ""}`;
    resultMap.set(key, r.total_score);
  }

  // Group puzzle rows by date (insertion order preserves date-desc ordering)
  const byDate = new Map<string, Array<{ category: string | null }>>();
  for (const p of puzzles as { date: string; category: string | null }[]) {
    if (!byDate.has(p.date)) byDate.set(p.date, []);
    byDate.get(p.date)!.push({ category: p.category });
  }

  const entries: ArchiveEntry[] = [...byDate.entries()].map(([date, puzzleList]) => {
    const puzzleEntries: ArchivePuzzleEntry[] = puzzleList.map(({ category }) => {
      const key = `${date}|${category ?? ""}`;
      const score = resultMap.get(key);
      return {
        category,
        label: category ? (CATEGORY_LABELS[category] ?? category) : "daily puzzle",
        played: resultMap.has(key),
        totalScore: score ?? null,
      };
    });

    return {
      date,
      puzzles: puzzleEntries,
      playedCount: puzzleEntries.filter((p) => p.played).length,
      totalCount: puzzleEntries.length,
    };
  });

  return NextResponse.json(entries);
}
