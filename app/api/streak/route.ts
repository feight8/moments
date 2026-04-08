import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { DbUserStreak } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const serviceClient = createServiceClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: streakRow } = await serviceClient
    .from("user_streaks")
    .select("current_streak, longest_streak, last_completed_date")
    .eq("user_id", user.id)
    .single<DbUserStreak>();

  return NextResponse.json({
    currentStreak: streakRow?.current_streak ?? 0,
    longestStreak: streakRow?.longest_streak ?? 0,
    lastCompletedDate: streakRow?.last_completed_date ?? null,
  });
}
