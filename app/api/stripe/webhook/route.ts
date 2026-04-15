import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { upsertPlusRecord } from "@/lib/plus";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

// ---------------------------------------------------------------------------
// Stripe sends webhooks as raw bytes — Next.js must NOT parse the body.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook verification failed: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ---------------------------------------------------------------------------
      // One-time payment completed (lifetime) OR subscription checkout completed
      // ---------------------------------------------------------------------------
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan as "monthly" | "annual" | undefined;

        if (!userId || !plan) break;

        // Both monthly and annual are subscriptions — provision now.
        // The subscription.updated event will keep period_end up to date.
        await upsertPlusRecord({
          userId,
          plan,
          status: "active",
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
        });
        break;
      }

      // ---------------------------------------------------------------------------
      // Subscription renewed / updated (period extended, plan changed)
      // ---------------------------------------------------------------------------
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        const plan = (sub.metadata?.plan ?? "monthly") as "monthly" | "annual";
        if (!userId) break;

        const isActive = sub.status === "active" || sub.status === "trialing";
        const periodEndTs = (sub as unknown as { current_period_end?: number }).current_period_end
          ?? sub.items?.data?.[0]?.current_period_end;
        await upsertPlusRecord({
          userId,
          plan,
          status: isActive ? "active" : "cancelled",
          stripeCustomerId: sub.customer as string,
          stripeSubscriptionId: sub.id,
          currentPeriodEnd: periodEndTs ? new Date(periodEndTs * 1000) : undefined,
        });
        break;
      }

      // ---------------------------------------------------------------------------
      // Subscription cancelled or fully expired
      // ---------------------------------------------------------------------------
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        const plan = (sub.metadata?.plan ?? "monthly") as "monthly" | "annual";
        if (!userId) break;

        const periodEndTs = (sub as unknown as { current_period_end?: number }).current_period_end
          ?? sub.items?.data?.[0]?.current_period_end;
        await upsertPlusRecord({
          userId,
          plan,
          status: "expired",
          stripeCustomerId: sub.customer as string,
          stripeSubscriptionId: sub.id,
          currentPeriodEnd: periodEndTs ? new Date(periodEndTs * 1000) : undefined,
        });
        break;
      }

      // ---------------------------------------------------------------------------
      // Payment failed — grace period is handled by Stripe; we log here
      // ---------------------------------------------------------------------------
      case "invoice.payment_failed": {
        // Stripe will retry and eventually cancel the subscription.
        // No action needed — subscription.deleted will fire if unrecoverable.
        break;
      }

      default:
        // Unhandled event type — ignore
        break;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe webhook]", event.type, msg);
    return NextResponse.json({ error: "Handler error." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
