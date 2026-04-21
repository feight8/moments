import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

// DELETE /api/groups/[id]/members/[userId] — owner removes a specific member
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  const { user, error: authError } = await getUserFromRequest(req);
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const client = createServiceClient();
  const { id: groupId, userId: targetUserId } = params;

  // Verify requester is the group owner
  const { data: group } = await client
    .from("groups")
    .select("owner_id")
    .eq("id", groupId)
    .single();

  if (!group) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  if (group.owner_id !== user.id) {
    return NextResponse.json({ error: "Only the group owner can remove members." }, { status: 403 });
  }

  if (targetUserId === user.id) {
    return NextResponse.json({ error: "Owner cannot remove themselves. Delete the group instead." }, { status: 400 });
  }

  const { error } = await client
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", targetUserId);

  if (error) {
    return NextResponse.json({ error: "Failed to remove member." }, { status: 500 });
  }

  return NextResponse.json({ action: "removed" });
}
