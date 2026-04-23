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

  const priceIds: Record<string, string | undefined> = {
    monthly: process.env.STRIPE_PRICE_MONTHLY,
    annual:  process.env.STRIPE_PRICE_ANNUAL,
  };
  const priceId = priceIds[plan];
  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe price not configured." },
      { status: 500 }
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 500 });
  }

  const admin = createServiceClient();

  // ------------------------------------------------------------------
  // Resolve the user and their email across three possible states:
  //
  //  1. Linked account — user has email already, just use it
  //  2. Anonymous session — user played but never signed up; link email now
  //  3. No session — brand new visitor; create a fresh account
  // ------------------------------------------------------------------
  let userId: string;
  let customerEmail: string;

  const { user } = await getUserFromRequest(req);

  if (user?.email) {
    // Case 1: already has a full account
    userId = user.id;
    customerEmail = user.email;

  } else if (user) {
    // Case 2: anonymous session — link email + password via admin API
    if (!bodyEmail || !bodyPassword || bodyPassword.length < 8) {
      return NextResponse.json(
        { error: "Please enter your email and a password (8+ characters)." },
        { status: 400 }
      );
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      email: bodyEmail,
      password: bodyPassword,
      email_confirm: true,
    });

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message ?? "Could not save your account. Try a different email." },
        { status: 400 }
      );
    }

    userId = user.id;
    customerEmail = bodyEmail;

  } else {
    // Case 3: no session at all — create a new Supabase account
    if (!bodyEmail || !bodyPassword || bodyPassword.length < 8) {
      return NextResponse.json(
        { error: "Please enter your email and a password (8+ characters)." },
        { status: 400 }
      );
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: bodyEmail,
      password: bodyPassword,
      email_confirm: true,
    });

    if (createError || !created.user) {
      return NextResponse.json(
        { error: createError?.message ?? "Could not create account. Try a different email." },
        { status: 400 }
      );
    }

    userId = created.user.id;
    customerEmail = bodyEmail;
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
    metadata: { user_id: userId, plan },
    subscription_data: { metadata: { user_id: userId, plan } },
  });

  return NextResponse.json({ url: session.url });
}
