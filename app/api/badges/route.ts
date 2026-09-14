import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/supabase/auth";
import type { Badge, UserBadge } from "@/types";

export const dynamic = "force-dynamic";

function rowToBadge(row: Record<string, unknown>): Badge {
  return {
    id:             row.id as string,
    name:           row.name as string,
    description:    row.description as string,
    emoji:          row.emoji as string,
    iconUrl:        row.icon_url as string | null,
    conditionType:  row.condition_type as string,
    conditionValue: row.condition_value as number | null,
    conditionMeta:  row.condition_meta as Record<string, string> | null,
    isActive:       row.is_active as boolean,
    sortOrder:      row.sort_order as number,
  };
}

export async function GET(req: NextRequest) {
  const { user, error: authError } = await getUserFromRequest(req);
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const client = createServiceClient();

  // All active badges
  const { data: badgeRows } = await client
    .from("badges")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  const allBadges = (badgeRows ?? []).map((r) => rowToBadge(r as Record<string, unknown>));

  // User's earned badges
  const { data: earnedRows } = await client
    .from("user_badges")
    .select("badge_id, earned_at")
    .eq("user_id", user.id)
    .order("earned_at", { ascending: false });

  const earnedMap = new Map<string, string>(
    (earnedRows ?? []).map((r: { badge_id: string; earned_at: string }) => [r.badge_id, r.earned_at])
  );

  const earned: UserBadge[] = [];
  const locked: Badge[] = [];

  for (const badge of allBadges) {
    const earnedAt = earnedMap.get(badge.id);
    if (earnedAt) {
      earned.push({ badge, earnedAt });
    } else {
      locked.push(badge);
    }
  }

  // Sort earned by most recently earned first
  earned.sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime());

  return NextResponse.json({ earned, locked });
}
