import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/plus";

export const dynamic = "force-dynamic";

async function requireAdmin(req: NextRequest): Promise<{ userId: string } | NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  return { userId: user.id };
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const client = createServiceClient();

  const { data: badges } = await client
    .from("badges")
    .select("*")
    .order("sort_order");

  // Count earners per badge
  const { data: earnedCounts } = await client
    .from("user_badges")
    .select("badge_id");

  const countMap = new Map<string, number>();
  for (const row of earnedCounts ?? []) {
    const r = row as { badge_id: string };
    countMap.set(r.badge_id, (countMap.get(r.badge_id) ?? 0) + 1);
  }

  const result = (badges ?? []).map((b) => ({
    ...b,
    earnedCount: countMap.get(b.id as string) ?? 0,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const { name, description, emoji, icon_url, condition_type, condition_value, condition_meta, sort_order } = body;

  if (!name || !description || !emoji || !condition_type) {
    return NextResponse.json({ error: "name, description, emoji, and condition_type are required." }, { status: 400 });
  }

  const client = createServiceClient();
  const { data, error } = await client
    .from("badges")
    .insert({
      name,
      description,
      emoji,
      icon_url: icon_url ?? null,
      condition_type,
      condition_value: condition_value ?? null,
      condition_meta: condition_meta ?? null,
      sort_order: sort_order ?? 999,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
