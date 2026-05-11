import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { getUserPlusStatus } from "@/lib/plus";
import type { Group } from "@/types";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// POST /api/groups/join — join a group by invite code
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

  if (user.app_metadata?.provider === "anonymous" || !user.email) {
    return NextResponse.json(
      { error: "Please link an email account before joining a group." },
      { status: 403 }
    );
  }

  let body: { inviteCode?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const inviteCode = (body.inviteCode ?? "").trim().toLowerCase();
  if (!inviteCode) {
    return NextResponse.json({ error: "Invite code is required." }, { status: 400 });
  }

  const client = createServiceClient();

  // Look up group by invite code
  const { data: group, error: groupError } = await client
    .from("groups")
    .select("id, name, owner_id, invite_code, max_members, created_at")
    .eq("invite_code", inviteCode)
    .single();

  if (groupError || !group) {
    return NextResponse.json({ error: "Invite code not found." }, { status: 404 });
  }

  // Check if already a member
  const { data: existing } = await client
    .from("group_members")
    .select("user_id")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    // Already a member — return the group as if join succeeded
    const { count } = await client
      .from("group_members")
      .select("user_id", { count: "exact", head: true })
      .eq("group_id", group.id);

    return NextResponse.json({
      id: group.id,
      name: group.name,
      ownerId: group.owner_id,
      inviteCode: group.invite_code,
      memberCount: count ?? 0,
      createdAt: group.created_at,
    } as Group);
  }

  // Check member count against limit
  const { count: memberCount } = await client
    .from("group_members")
    .select("user_id", { count: "exact", head: true })
    .eq("group_id", group.id);

  if ((memberCount ?? 0) >= group.max_members) {
    return NextResponse.json({ error: "This group is full." }, { status: 400 });
  }

  // Check per-user group limit
  const { count: userGroupCount } = await client
    .from("group_members")
    .select("group_id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((userGroupCount ?? 0) >= 10) {
    return NextResponse.json({ error: "You can belong to at most 10 groups." }, { status: 400 });
  }

  const displayName = user.email.split("@")[0];
  const { error: joinError } = await client.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    display_name: displayName,
  });

  if (joinError) {
    console.error("[groups/join] insert failed:", joinError.message);
    return NextResponse.json({ error: "Failed to join group." }, { status: 500 });
  }

  const response: Group = {
    id: group.id,
    name: group.name,
    ownerId: group.owner_id,
    inviteCode: group.invite_code,
    memberCount: (memberCount ?? 0) + 1,
    createdAt: group.created_at,
  };

  return NextResponse.json(response, { status: 201 });
}
