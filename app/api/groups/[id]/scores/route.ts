import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { getUserPlusStatus } from "@/lib/plus";
import { todayDate } from "@/lib/dates";
import { buildEmojiRow } from "@/lib/scoring";
import type { GroupScoresResponse, GroupMemberScore, ScoredGuess } from "@/types";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET /api/groups/[id]/scores?date=YYYY-MM-DD
// Returns the scoreboard for all group members on a given puzzle date.
// Scores are hidden (null) until the requesting user has played that date.
// ---------------------------------------------------------------------------
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await getUserFromRequest(req);
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { isPlus } = await getUserPlusStatus(user.id);
  if (!isPlus) {
    return NextResponse.json({ error: "Circa+ required." }, { status: 403 });
  }

  const client = createServiceClient();
  const { id: groupId } = await params;
  const dateParam = new URL(req.url).searchParams.get("date");
  const puzzleDate = dateParam ?? todayDate();

  // Verify requesting user is a member
  const { data: membership } = await client
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  // Fetch group name + all members
  const { data: group } = await client
    .from("groups")
    .select("name, owner_id")
    .eq("id", groupId)
    .single();

  if (!group) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  const { data: members } = await client
    .from("group_members")
    .select("user_id, display_name")
    .eq("group_id", groupId);

  if (!members) {
    return NextResponse.json({ error: "Failed to load members." }, { status: 500 });
  }

  const memberIds = members.map((m: { user_id: string }) => m.user_id);

  // Check if the requesting user has played this date
  const { data: viewerResult } = await client
    .from("user_results")
    .select("total_score")
    .eq("user_id", user.id)
    .eq("puzzle_date", puzzleDate)
    .single();

  const viewerHasPlayed = viewerResult !== null;

  // Fetch results for all members on this date (service client bypasses RLS)
  const { data: results } = await client
    .from("user_results")
    .select("user_id, total_score, guesses")
    .eq("puzzle_date", puzzleDate)
    .in("user_id", memberIds);

  const resultMap = new Map<string, { total_score: number; guesses: ScoredGuess[] }>();
  for (const r of results ?? []) {
    resultMap.set(r.user_id, r);
  }

  const memberScores: GroupMemberScore[] = members.map((m: { user_id: string; display_name: string }) => {
    const result = resultMap.get(m.user_id);
    const isViewer = m.user_id === user.id;

    // Always show the viewer's own score; hide others until viewer has played
    const showScore = isViewer || viewerHasPlayed;

    return {
      userId: m.user_id,
      displayName: m.user_id === user.id ? `${m.display_name} (you)` : m.display_name,
      isOwner: m.user_id === group.owner_id,
      totalScore: showScore && result ? result.total_score : null,
      emojiRow: showScore && result ? buildEmojiRow(result.guesses.map((g) => g.score)) : null,
      perfectCount: showScore && result ? result.guesses.filter((g) => g.isPerfect).length : null,
    };
  });

  // Sort: played (by score desc) first, then unplayed
  memberScores.sort((a, b) => {
    if (a.totalScore !== null && b.totalScore !== null) return b.totalScore - a.totalScore;
    if (a.totalScore !== null) return -1;
    if (b.totalScore !== null) return 1;
    return 0;
  });

  const response: GroupScoresResponse = {
    groupId,
    groupName: group.name,
    puzzleDate,
    viewerHasPlayed,
    members: memberScores,
  };

  return NextResponse.json(response);
}
