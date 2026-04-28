import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { getUserPlusStatus, isAdminUser, isCategoriesEnabled } from "@/lib/plus";

export const dynamic = "force-dynamic";

// GET /api/plus/status — returns the current user's Plus status, admin flag, and feature flags
export async function GET(req: NextRequest) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return NextResponse.json({
      isPlus: false,
      plan: null,
      currentPeriodEnd: null,
      isAdmin: false,
      categoriesEnabled: isCategoriesEnabled(),
    });
  }
  const status = await getUserPlusStatus(user.id);
  return NextResponse.json({
    ...status,
    isAdmin: isAdminUser(user.id),
    categoriesEnabled: isCategoriesEnabled(),
  });
}
