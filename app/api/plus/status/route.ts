import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { getUserPlusStatus } from "@/lib/plus";

export const dynamic = "force-dynamic";

// GET /api/plus/status — returns the current user's Plus status
export async function GET(req: NextRequest) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return NextResponse.json({ isPlus: false, plan: null, currentPeriodEnd: null });
  }
  const status = await getUserPlusStatus(user.id);
  return NextResponse.json(status);
}
