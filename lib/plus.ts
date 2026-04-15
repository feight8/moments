/**
 * Circa+ server-side utilities.
 * All functions use the service client — never call from browser code.
 */
import { createServiceClient } from "@/lib/supabase/server";

export interface PlusStatus {
  isPlus: boolean;
  plan: "monthly" | "annual" | null;
  currentPeriodEnd: string | null;
}

/**
 * Check whether a user has an active Circa+ subscription.
 * Returns false for anonymous users and expired subscriptions.
 */
export async function getUserPlusStatus(userId: string): Promise<PlusStatus> {
  // Admin bypass — set PLUS_ADMIN_USER_IDS to a comma-separated list of Supabase UUIDs
  const adminIds = (process.env.PLUS_ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (adminIds.includes(userId)) {
    return { isPlus: true, plan: "annual", currentPeriodEnd: null };
  }

  const client = createServiceClient();

  const { data } = await client
    .from("user_plus")
    .select("plan, status, current_period_end")
    .eq("user_id", userId)
    .single();

  if (!data) return { isPlus: false, plan: null, currentPeriodEnd: null };

  const { plan, status, current_period_end } = data as {
    plan: "monthly" | "annual";
    status: string;
    current_period_end: string | null;
  };

  if (status !== "active") {
    return { isPlus: false, plan, currentPeriodEnd: current_period_end };
  }

  // Annual/monthly: validate period hasn't expired
  if (current_period_end && new Date(current_period_end) > new Date()) {
    return { isPlus: true, plan, currentPeriodEnd: current_period_end };
  }

  return { isPlus: false, plan, currentPeriodEnd: current_period_end };
}

/**
 * Provision or update a user's Plus record.
 * Called from the Stripe webhook handler.
 */
export async function upsertPlusRecord(params: {
  userId: string;
  plan: "monthly" | "annual";
  status: "active" | "cancelled" | "expired";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: Date | null;
}) {
  const client = createServiceClient();
  await client.from("user_plus").upsert({
    user_id: params.userId,
    plan: params.plan,
    status: params.status,
    stripe_customer_id: params.stripeCustomerId ?? null,
    stripe_subscription_id: params.stripeSubscriptionId ?? null,
    current_period_end: params.currentPeriodEnd?.toISOString() ?? null,
    updated_at: new Date().toISOString(),
  });
}

/**
 * Use a streak shield for a Plus user.
 * Returns true if a shield was consumed, false if none available.
 */
export async function consumeStreakShield(userId: string, date: string): Promise<boolean> {
  const client = createServiceClient();
  const monthKey = date.slice(0, 7); // YYYY-MM

  const { data } = await client
    .from("streak_shields")
    .select("shields_remaining, month_key")
    .eq("user_id", userId)
    .single();

  // Reset shield if it's a new month
  const currentMonthKey = data?.month_key;
  const shieldsRemaining = currentMonthKey === monthKey
    ? (data?.shields_remaining ?? 0)
    : 1; // New month — reset to 1

  if (shieldsRemaining <= 0) return false;

  await client.from("streak_shields").upsert({
    user_id: userId,
    month_key: monthKey,
    shields_remaining: shieldsRemaining - 1,
    updated_at: new Date().toISOString(),
  });

  return true;
}
