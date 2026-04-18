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
 * Returns true if the user ID is in the PLUS_ADMIN_USER_IDS env var.
 * Used to gate admin-only features like previewing future puzzles.
 */
export function isAdminUser(userId: string): boolean {
  return (process.env.PLUS_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(userId);
}

/**
 * Check whether a user has an active Circa+ subscription.
 * Returns false for anonymous users and expired subscriptions.
 */
export async function getUserPlusStatus(userId: string): Promise<PlusStatus> {
  // Admin bypass — set PLUS_ADMIN_USER_IDS to a comma-separated list of Supabase UUIDs
  if (isAdminUser(userId)) {
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

  // If period_end hasn't arrived yet (race between checkout.session.completed
  // and customer.subscription.updated webhook), trust the "active" status.
  if (!current_period_end) {
    return { isPlus: true, plan, currentPeriodEnd: null };
  }

  if (new Date(current_period_end) > new Date()) {
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

  // Determine remaining shields with explicit cases for clarity
  const shieldsRemaining: number =
    data === null                  ? 1               // No record yet — fresh Plus user
    : data.month_key !== monthKey  ? 1               // New month — reset to 1
    : data.shields_remaining;                        // Same month — use stored count

  if (shieldsRemaining <= 0) return false;

  await client.from("streak_shields").upsert({
    user_id: userId,
    month_key: monthKey,
    shields_remaining: shieldsRemaining - 1,
    updated_at: new Date().toISOString(),
  });

  return true;
}
