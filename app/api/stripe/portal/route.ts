import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// POST /api/stripe/portal
// Creates a Stripe Billing Portal session for the current user and returns the URL.
export async function POST(req: NextRequest) {
  const { user, error: authError } = await getUserFromRequest(req);
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 500 });
  }

  // Look up the Stripe customer ID from user_plus
  const admin = createServiceClient();
  const { data } = await admin
    .from("user_plus")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  if (!data?.stripe_customer_id) {
    return NextResponse.json({ error: "No subscription found." }, { status: 404 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-03-25.dahlia",
  });

  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: data.stripe_customer_id,
    return_url: `${origin}/account`,
  });

  return NextResponse.json({ url: session.url });
}
