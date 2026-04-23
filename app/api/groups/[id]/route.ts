import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { getUserPlusStatus } from "@/lib/plus";
import type { GroupMember } from "@/types";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET /api/groups/[id] — group details + member list
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

  // Verify membership
  const { data: membership } = await client
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  const { data: group, error: groupError } = await client
    .from("groups")
    .select("id, name, owner_id, invite_code, created_at")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  const { data: members, error: membersError } = await client
    .from("group_members")
    .select("user_id, display_name, joined_at")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });

  if (membersError) {
    return NextResponse.json({ error: "Failed to load members." }, { status: 500 });
  }

  const memberList: GroupMember[] = (members ?? []).map((m: {
    user_id: string; display_name: string; joined_at: string;
  }) => ({
    userId: m.user_id,
    displayName: m.display_name,
    joinedAt: m.joined_at,
    isOwner: m.user_id === group.owner_id,
  }));

  return NextResponse.json({
    group: {
      id: group.id,
      name: group.name,
      ownerId: group.owner_id,
      inviteCode: group.invite_code,
      memberCount: memberList.length,
      createdAt: group.created_at,
    },
    members: memberList,
  });
}

// ---------------------------------------------------------------------------
// DELETE /api/groups/[id] — owner deletes group; member leaves
// ---------------------------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await getUserFromRequest(req);
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const client = createServiceClient();
  const { id: groupId } = await params;

  const { data: group } = await client
    .from("groups")
    .select("owner_id")
    .eq("id", groupId)
    .single();

  if (!group) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  if (group.owner_id === user.id) {
    // Owner — delete the whole group (cascades to members)
    const { error } = await client.from("groups").delete().eq("id", groupId);
    if (error) {
      return NextResponse.json({ error: "Failed to delete group." }, { status: 500 });
    }
    return NextResponse.json({ action: "deleted" });
  }

  // Non-owner — just remove self from members
  const { error } = await client
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to leave group." }, { status: 500 });
  }

  return NextResponse.json({ action: "left" });
}
