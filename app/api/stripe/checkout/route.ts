import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getUserFromRequest } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

// Stripe Price IDs — create these in your Stripe Dashboard and set as env vars.
const PRICE_IDS: Record<string, string> = {
  monthly: process.env.STRIPE_PRICE_MONTHLY!,  // $2.99/month recurring
  annual:  process.env.STRIPE_PRICE_ANNUAL!,   // $14.99/year recurring
};

interface CheckoutBody {
  plan: "monthly" | "annual";
}

export async function POST(req: NextRequest) {
  const { user, error: authError } = await getUserFromRequest(req);

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Anonymous users can't subscribe — they need to link an account first.
  // Supabase anonymous users have is_anonymous = true in app_metadata.
  if (user.app_metadata?.provider === "anonymous" || !user.email) {
    return NextResponse.json(
      { error: "Please create an account before subscribing." },
      { status: 403 }
    );
  }

  let body: CheckoutBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { plan } = body;
  if (plan !== "monthly" && plan !== "annual") {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe price not configured. Set STRIPE_PRICE_MONTHLY / STRIPE_PRICE_ANNUAL." },
      { status: 500 }
    );
  }

  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email,
    success_url: `${origin}/plus/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/plus`,
    metadata: {
      user_id: user.id,
      plan,
    },
    subscription_data: { metadata: { user_id: user.id, plan } },
  });

  return NextResponse.json({ url: session.url });
}
