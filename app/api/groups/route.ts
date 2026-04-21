import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { getUserPlusStatus } from "@/lib/plus";
import type { Group } from "@/types";

export const dynamic = "force-dynamic";

const MAX_GROUPS_PER_USER = 10;

// ---------------------------------------------------------------------------
// GET /api/groups — list all groups the requesting user belongs to
// ---------------------------------------------------------------------------
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

  // Fetch groups this user belongs to, with member counts
  const { data: memberships, error } = await client
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to load groups." }, { status: 500 });
  }

  if (!memberships || memberships.length === 0) {
    return NextResponse.json([] as Group[]);
  }

  const groupIds = memberships.map((m: { group_id: string }) => m.group_id);

  const { data: groups, error: groupsError } = await client
    .from("groups")
    .select("id, name, owner_id, invite_code, created_at")
    .in("id", groupIds)
    .order("created_at", { ascending: false });

  if (groupsError || !groups) {
    return NextResponse.json({ error: "Failed to load groups." }, { status: 500 });
  }

  // Get member counts for each group
  const { data: counts } = await client
    .from("group_members")
    .select("group_id")
    .in("group_id", groupIds);

  const countMap = new Map<string, number>();
  for (const row of counts ?? []) {
    countMap.set(row.group_id, (countMap.get(row.group_id) ?? 0) + 1);
  }

  const response: Group[] = groups.map((g: {
    id: string; name: string; owner_id: string; invite_code: string; created_at: string;
  }) => ({
    id: g.id,
    name: g.name,
    ownerId: g.owner_id,
    inviteCode: g.invite_code,
    memberCount: countMap.get(g.id) ?? 0,
    createdAt: g.created_at,
  }));

  return NextResponse.json(response);
}

// ---------------------------------------------------------------------------
// POST /api/groups — create a new group
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const { user, error: authError } = await getUserFromRequest(req);
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { isPlus } = await getUserPlusStatus(user.id);
  if (!isPlus) {
    return NextResponse.json({ error: "Circa+ required." }, { status: 403 });
  }

  // Anonymous users can't create groups (must have linked email account)
  if (user.app_metadata?.provider === "anonymous" || !user.email) {
    return NextResponse.json(
      { error: "Please link an email account before creating a group." },
      { status: 403 }
    );
  }

  let body: { name?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  if (name.length < 2 || name.length > 40) {
    return NextResponse.json({ error: "Group name must be 2–40 characters." }, { status: 400 });
  }

  const client = createServiceClient();

  // Enforce per-user group limit
  const { count } = await client
    .from("group_members")
    .select("group_id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= MAX_GROUPS_PER_USER) {
    return NextResponse.json(
      { error: `You can belong to at most ${MAX_GROUPS_PER_USER} groups.` },
      { status: 400 }
    );
  }

  // Create group
  const { data: group, error: insertError } = await client
    .from("groups")
    .insert({ name, owner_id: user.id })
    .select("id, name, owner_id, invite_code, created_at")
    .single();

  if (insertError || !group) {
    console.error("[groups] insert failed:", insertError?.message);
    return NextResponse.json({ error: "Failed to create group." }, { status: 500 });
  }

  // Add owner as first member
  const displayName = user.email.split("@")[0];
  await client.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    display_name: displayName,
  });

  const response: Group = {
    id: group.id,
    name: group.name,
    ownerId: group.owner_id,
    inviteCode: group.invite_code,
    memberCount: 1,
    createdAt: group.created_at,
  };

  return NextResponse.json(response, { status: 201 });
}
