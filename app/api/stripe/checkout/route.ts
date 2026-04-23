import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getUserFromRequest } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

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

  const priceIds: Record<string, string | undefined> = {
    monthly: process.env.STRIPE_PRICE_MONTHLY,
    annual:  process.env.STRIPE_PRICE_ANNUAL,
  };
  const priceId = priceIds[plan];
  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe price not configured. Set STRIPE_PRICE_MONTHLY / STRIPE_PRICE_ANNUAL." },
      { status: 500 }
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 500 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-03-25.dahlia",
  });

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
