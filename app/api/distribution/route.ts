import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { getUserPlusStatus } from "@/lib/plus";
import { todayUTC } from "@/lib/dates";

export const dynamic = "force-dynamic";

export interface DistributionBucket {
  label: string;
  min: number;
  max: number; // inclusive; use Infinity for the last bucket
  count: number;
}

export interface DistributionResponse {
  buckets: DistributionBucket[];
  totalPlayers: number;
  /** Whether the requesting user is Plus and still anonymous (show link-account prompt) */
  showLinkPrompt: boolean;
  puzzleDate: string;
}

const BUCKETS: Omit<DistributionBucket, "count">[] = [
  { label: "0–100",   min: 0,   max: 100 },
  { label: "101–200", min: 101, max: 200 },
  { label: "201–300", min: 201, max: 300 },
  { label: "301–400", min: 301, max: 400 },
  { label: "401–499", min: 401, max: 499 },
  { label: "500+",    min: 500, max: Infinity },
];

export async function GET(req: NextRequest) {
  const serviceClient = createServiceClient();
  const { user } = await getUserFromRequest(req);

  // Determine puzzle date — default to today, allow ?date= override
  const paramDate = new URL(req.url).searchParams.get("date");
  const puzzleDate = paramDate ?? todayUTC();

  // Fetch all scores for this puzzle date (aggregate — no PII exposed)
  const { data: rows } = await serviceClient
    .from("user_results")
    .select("total_score")
    .eq("puzzle_date", puzzleDate);

  const scores = (rows ?? []).map((r: { total_score: number }) => r.total_score);

  const buckets: DistributionBucket[] = BUCKETS.map((b) => ({
    ...b,
    count: scores.filter((s) => s >= b.min && s <= b.max).length,
  }));

  // Determine whether to show the account-linking prompt:
  // only if user is Plus AND their account is still anonymous (no email)
  let showLinkPrompt = false;
  if (user) {
    const { isPlus } = await getUserPlusStatus(user.id);
    const isAnonymous =
      user.app_metadata?.provider === "anonymous" || !user.email;
    showLinkPrompt = isPlus && isAnonymous;
  }

  const response: DistributionResponse = {
    buckets,
    totalPlayers: scores.length,
    showLinkPrompt,
    puzzleDate,
  };

  return NextResponse.json(response);
}
