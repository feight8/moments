import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { getUserPlusStatus } from "@/lib/plus";
import { todayUTC } from "@/lib/dates";

export const dynamic = "force-dynamic";

export interface ArchiveEntry {
  date: string;         // YYYY-MM-DD
  played: boolean;
  totalScore: number | null;
}

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
  const today = todayUTC();

  // All past puzzles (exclude today — play today via /play)
  const { data: puzzles, error } = await client
    .from("daily_puzzles")
    .select("date")
    .lt("date", today)
    .order("date", { ascending: false });

  if (error || !puzzles) {
    return NextResponse.json({ error: "Failed to load archive." }, { status: 500 });
  }

  if (puzzles.length === 0) {
    return NextResponse.json([]);
  }

  // Fetch which ones this user has already played
  const dates = puzzles.map((p: { date: string }) => p.date);
  const { data: results } = await client
    .from("user_results")
    .select("puzzle_date, total_score")
    .eq("user_id", user.id)
    .in("puzzle_date", dates);

  const playedMap = new Map<string, number>(
    (results ?? []).map((r: { puzzle_date: string; total_score: number }) => [
      r.puzzle_date,
      r.total_score,
    ])
  );

  const entries: ArchiveEntry[] = puzzles.map((p: { date: string }) => ({
    date: p.date,
    played: playedMap.has(p.date),
    totalScore: playedMap.get(p.date) ?? null,
  }));

  return NextResponse.json(entries);
}
