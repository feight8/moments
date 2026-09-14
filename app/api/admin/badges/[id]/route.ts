import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/plus";

export const dynamic = "force-dynamic";

async function requireAdmin(): Promise<{ ok: true } | NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  return { ok: true };
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const client = createServiceClient();
  const { data, error } = await client
    .from("badges")
    .update({
      ...(body.name           !== undefined && { name:            body.name }),
      ...(body.description    !== undefined && { description:     body.description }),
      ...(body.emoji          !== undefined && { emoji:           body.emoji }),
      ...(body.icon_url        !== undefined && { icon_url:        body.icon_url }),
      ...(body.condition_type !== undefined && { condition_type:  body.condition_type }),
      ...(body.condition_value !== undefined && { condition_value: body.condition_value }),
      ...(body.condition_meta  !== undefined && { condition_meta:  body.condition_meta }),
      ...(body.sort_order      !== undefined && { sort_order:      body.sort_order }),
      ...(body.isActive        !== undefined && { is_active:       body.isActive }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const client = createServiceClient();
  const { error } = await client.from("badges").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
