import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
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
    return NextResponse.json({ error: "Stripe price not configured." }, { status: 500 });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 500 });
  }

  const admin = createServiceClient();
  const { user } = await getUserFromRequest(req);

  let userId: string;
  let customerEmail: string;

  if (user?.email) {
    // ----------------------------------------------------------------
    // Case 1: already has a full linked account
    // ----------------------------------------------------------------
    userId = user.id;
    customerEmail = user.email;

  } else {
    // ----------------------------------------------------------------
    // Cases 2 & 3: anonymous or no session — need email + password
    // ----------------------------------------------------------------
    if (!bodyEmail || !bodyPassword || bodyPassword.length < 8) {
      return NextResponse.json(
        { error: "Please enter your email and a password (8+ characters)." },
        { status: 400 }
      );
    }

    // Try to create a new account (works for brand-new emails).
    // If the email already exists, fall through to sign-in below.
    let resolvedId: string | null = null;

    if (user) {
      // Case 2: anonymous session — upgrade it to a full account
      const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
        email: bodyEmail,
        password: bodyPassword,
        email_confirm: true,
      });

      if (!updateError) {
        resolvedId = user.id;
      }
      // If update failed (e.g. email taken), fall through to sign-in
    } else {
      // Case 3: no session — create fresh account
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: bodyEmail,
        password: bodyPassword,
        email_confirm: true,
      });

      if (!createError && created.user) {
        resolvedId = created.user.id;
      }
      // If create failed (e.g. email taken), fall through to sign-in
    }

    if (!resolvedId) {
      // Account already exists — verify the password by signing in with
      // the anon key client (service role bypasses password checks).
      const anonClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: signIn, error: signInError } = await anonClient.auth.signInWithPassword({
        email: bodyEmail,
        password: bodyPassword,
      });

      if (signInError || !signIn.user) {
        return NextResponse.json(
          { error: "Incorrect password for that email. Please try again." },
          { status: 400 }
        );
      }

      resolvedId = signIn.user.id;
    }

    userId = resolvedId;
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
