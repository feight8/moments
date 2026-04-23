import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface CheckoutBody {
  plan: "monthly" | "annual";
  email?: string;
  password?: string;
}

export async function POST(req: NextRequest) {
  const { user, error: authError } = await getUserFromRequest(req);

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: CheckoutBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { plan, email: bodyEmail, password: bodyPassword } = body;
  if (plan !== "monthly" && plan !== "annual") {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  // Determine the email to use for this checkout session
  let customerEmail = user.email ?? null;

  // Anonymous user — create their account now using the admin API so we can
  // proceed to checkout immediately without a confirmation-click gate.
  if (!customerEmail) {
    if (!bodyEmail || !bodyPassword || bodyPassword.length < 8) {
      return NextResponse.json(
        { error: "Please enter your email and a password (8+ characters)." },
        { status: 400 }
      );
    }

    const admin = createServiceClient();
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      email: bodyEmail,
      password: bodyPassword,
      email_confirm: true,
    });

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message ?? "Failed to create account. Try a different email." },
        { status: 400 }
      );
    }

    customerEmail = bodyEmail;
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
    customer_email: customerEmail,
    success_url: `${origin}/plus/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/plus`,
    metadata: { user_id: user.id, plan },
    subscription_data: { metadata: { user_id: user.id, plan } },
  });

  return NextResponse.json({ url: session.url });
}
