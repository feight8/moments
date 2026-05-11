import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { getUserPlusStatus, isAdminUser, isCategoriesEnabled } from "@/lib/plus";
import { todayDate } from "@/lib/dates";
import type { DailyPuzzle, PublicEvent, DbDailyPuzzle, DbEvent } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const requestedDate = req.nextUrl.searchParams.get("date");
  const category = req.nextUrl.searchParams.get("category") ?? null;
  const today = todayDate();

  // Determine if we need auth (past/future date or category access)
  const needsAuth = (requestedDate && requestedDate !== today) || category !== null;

  let userId: string | null = null;
  if (needsAuth) {
    const { user, error } = await getUserFromRequest(req);
    if (error || !user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    userId = user.id;
  }

  // Past date → requires Plus; future date → requires admin
  if (requestedDate && requestedDate !== today && userId) {
    if (requestedDate > today) {
      if (!isAdminUser(userId)) {
        return NextResponse.json({ error: "No puzzle found for that date." }, { status: 404 });
      }
    } else {
      const { isPlus } = await getUserPlusStatus(userId);
      if (!isPlus) {
        return NextResponse.json({ error: "Circa+ required to play archive puzzles." }, { status: 403 });
      }
    }
  }

  // Category access → requires admin or global flag
  if (category !== null && userId) {
    if (!isAdminUser(userId) && !isCategoriesEnabled()) {
      return NextResponse.json({ error: "No puzzle found." }, { status: 404 });
    }
  }

  // Fetch the puzzle row
  let puzzle: DbDailyPuzzle | null = null;
  const client = requestedDate ? createServiceClient() : supabase;

  if (requestedDate) {
    const { data } = await (category
      ? client.from("daily_puzzles").select("*").eq("date", requestedDate).eq("category", category)
      : client.from("daily_puzzles").select("*").eq("date", requestedDate).is("category", null)
    ).single<DbDailyPuzzle>();
    puzzle = data ?? null;

    if (!puzzle) {
      return NextResponse.json({ error: "No puzzle found for that date." }, { status: 404 });
    }
  } else if (category) {
    // Category puzzle: today first, then latest fallback
    const { data: todaysPuzzle } = await client
      .from("daily_puzzles")
      .select("*")
      .eq("date", today)
      .eq("category", category)
      .single<DbDailyPuzzle>();

    if (todaysPuzzle) {
      puzzle = todaysPuzzle;
    } else {
      const { data: latestPuzzle } = await client
        .from("daily_puzzles")
        .select("*")
        .eq("category", category)
        .order("date", { ascending: false })
        .limit(1)
        .single<DbDailyPuzzle>();
      puzzle = latestPuzzle ?? null;
    }
  } else {
    // Main daily: today first, then latest fallback (category IS NULL)
    const { data: todaysPuzzle } = await client
      .from("daily_puzzles")
      .select("*")
      .eq("date", today)
      .is("category", null)
      .single<DbDailyPuzzle>();

    if (todaysPuzzle) {
      puzzle = todaysPuzzle;
    } else {
      const { data: latestPuzzle } = await client
        .from("daily_puzzles")
        .select("*")
        .is("category", null)
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

  const response: DailyPuzzle = { date: puzzle.date, category: puzzle.category, events: ordered };
  return NextResponse.json(response);
}
