import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { upsertPlusRecord } from "@/lib/plus";

export const dynamic = "force-dynamic";

// GET /api/plus/verify-checkout?session_id=cs_xxx
//
// Called from /plus/success after Stripe redirects back.
// Provisions Plus directly from the Stripe session as a reliable fallback
// for cases where the webhook hasn't fired yet (missing secret, timing, etc).
// Safe to call multiple times — upsertPlusRecord is idempotent.
export async function GET(req: NextRequest) {
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id." }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-03-25.dahlia",
  });

  // Retrieve the completed checkout session from Stripe
  let stripeSession: Stripe.Checkout.Session;
  try {
    stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ error: "Could not retrieve checkout session." }, { status: 400 });
  }

  if (stripeSession.payment_status !== "paid") {
    return NextResponse.json({ error: "Payment not completed." }, { status: 402 });
  }

  const userId = stripeSession.metadata?.user_id;
  const plan = stripeSession.metadata?.plan as "monthly" | "annual" | undefined;
  const email = stripeSession.customer_email ?? stripeSession.customer_details?.email ?? null;

  if (!userId || !plan) {
    return NextResponse.json({ error: "Session metadata missing." }, { status: 400 });
  }

  // Provision Plus (idempotent — safe even if the webhook already ran)
  await upsertPlusRecord({
    userId,
    plan,
    status: "active",
    stripeCustomerId: stripeSession.customer as string,
    stripeSubscriptionId: stripeSession.subscription as string,
  });

  // Check whether the current browser session already belongs to this user
  const { user: currentUser } = await getUserFromRequest(req);
  const alreadySignedIn = currentUser?.id === userId;

  // If the user isn't signed in as the Plus account, generate a magic link
  // so the success page can sign them in automatically.
  let magicLinkUrl: string | null = null;
  if (!alreadySignedIn && email) {
    const admin = createServiceClient();
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${new URL(req.url).origin}/plus/success?activated=1`,
      },
    });
    magicLinkUrl = linkData?.properties?.action_link ?? null;
  }

  return NextResponse.json({ userId, email, alreadySignedIn, magicLinkUrl });
}
