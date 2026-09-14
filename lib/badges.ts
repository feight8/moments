/**
 * Badge checking and awarding logic.
 * Called server-side only, never from browser code.
 */
import { createServiceClient } from "@/lib/supabase/server";
import type { Badge, ScoredGuess } from "@/types";

interface BadgeCheckContext {
  /** The game just submitted */
  latestResult: {
    totalScore: number;
    guesses: ScoredGuess[];
    category: string | null;
    date: string;
  };
  /** Updated streak (0 if category game) */
  currentStreak: number;
  /** Pre-computed stats from user_results (main daily only) */
  totalMainGames: number;
  lifetimeScore: number;
  perfectGameCount: number;
  /** Group membership count */
  groupCount: number;
  /** Categories played today (all, including this game) */
  playedCategoriesCount: number;
  /** Active categories in daily_puzzles for this date */
  activeCategoriesCount: number;
}

/** Convert a DB row into the public Badge type. */
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

/**
 * Badges only count play from this moment forward — lifetime aggregates
 * (total_score, total_games, perfect_games) ignore any user_results row
 * completed before this cutoff, so long-time players earn badges gradually
 * instead of unlocking a pile of them the moment badges ship.
 * 6:00 AM CDT (UTC-5) on 2026-09-14 — the planned release moment.
 */
const BADGES_LAUNCH_AT = "2026-09-14T11:00:00Z";

function isBadgeEarned(badge: Badge, ctx: BadgeCheckContext): boolean {
  const v = badge.conditionValue ?? 0;
  switch (badge.conditionType) {
    case "total_score":
      return ctx.lifetimeScore >= v;

    case "streak_days":
      return ctx.currentStreak >= v;

    case "total_games":
      return ctx.totalMainGames >= v;

    case "perfect_games":
      return ctx.perfectGameCount >= v;

    case "hat_trick": {
      const perfectCount = ctx.latestResult.guesses.filter((g) => g.isPerfect).length;
      return perfectCount >= v;
    }

    case "dead_reckoning": {
      const noPerfects = ctx.latestResult.guesses.every((g) => !g.isPerfect);
      return noPerfects && ctx.latestResult.totalScore >= v;
    }

    case "category_played": {
      const target = badge.conditionMeta?.category ?? null;
      return ctx.latestResult.category === target;
    }

    case "completionist":
      return (
        ctx.activeCategoriesCount > 0 &&
        ctx.playedCategoriesCount >= ctx.activeCategoriesCount
      );

    case "group_joined":
      return ctx.groupCount > 0;

    default:
      return false;
  }
}

/**
 * Check all unearned badges for a user after submitting a game.
 * Returns newly awarded Badge[] (empty if none or on error).
 * Never throws — failures are logged but don't affect the submit response.
 */
export async function checkAndAwardBadges(
  userId: string,
  ctx: BadgeCheckContext
): Promise<Badge[]> {
  try {
    const client = createServiceClient();

    // Fetch all active badges
    const { data: badgeRows, error: badgesErr } = await client
      .from("badges")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    if (badgesErr || !badgeRows) return [];

    // Fetch already-earned badge IDs for this user
    const { data: earnedRows } = await client
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", userId);

    const earnedIds = new Set((earnedRows ?? []).map((r: { badge_id: string }) => r.badge_id));

    // Check each un-earned badge
    const newlyEarned: Badge[] = [];
    for (const row of badgeRows) {
      const badge = rowToBadge(row as Record<string, unknown>);
      if (earnedIds.has(badge.id)) continue;
      if (isBadgeEarned(badge, ctx)) {
        newlyEarned.push(badge);
      }
    }

    if (newlyEarned.length === 0) return [];

    // Insert new user_badges rows
    const { error: insertErr } = await client.from("user_badges").insert(
      newlyEarned.map((b) => ({
        user_id:  userId,
        badge_id: b.id,
      }))
    );

    if (insertErr) {
      console.error("[badges] insert failed:", insertErr.message);
      return [];
    }

    return newlyEarned;
  } catch (err) {
    console.error("[badges] unexpected error:", err);
    return [];
  }
}

/**
 * Build the BadgeCheckContext from database queries.
 * Called inside POST /api/submit before checkAndAwardBadges.
 */
export async function buildBadgeContext(
  userId: string,
  latestResult: BadgeCheckContext["latestResult"],
  currentStreak: number
): Promise<BadgeCheckContext> {
  const client = createServiceClient();

  // Aggregate main-daily results for this user, counting only play since badges launched
  const { data: resultRows } = await client
    .from("user_results")
    .select("total_score")
    .eq("user_id", userId)
    .is("category", null)
    .gte("completed_at", BADGES_LAUNCH_AT);

  const scores = (resultRows ?? []).map((r: { total_score: number }) => r.total_score);
  const totalMainGames  = scores.length;
  const lifetimeScore   = scores.reduce((s: number, v: number) => s + v, 0);
  const perfectGameCount = scores.filter((s: number) => s >= 550).length;

  // Group membership count
  const { count: groupCount } = await client
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // Categories played today (to support completionist check)
  const { data: todayResults } = await client
    .from("user_results")
    .select("category")
    .eq("user_id", userId)
    .eq("puzzle_date", latestResult.date)
    .not("category", "is", null);

  const playedCategoriesCount = (todayResults ?? []).length;

  // Active categories available today
  const { count: activeCategoriesCount } = await client
    .from("daily_puzzles")
    .select("*", { count: "exact", head: true })
    .eq("date", latestResult.date)
    .not("category", "is", null);

  return {
    latestResult,
    currentStreak,
    totalMainGames,
    lifetimeScore,
    perfectGameCount,
    groupCount:           groupCount ?? 0,
    playedCategoriesCount,
    activeCategoriesCount: activeCategoriesCount ?? 0,
  };
}
