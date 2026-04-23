"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NavHeader from "@/components/NavHeader";
import PlusBadge from "@/components/PlusBadge";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Feature list
// ---------------------------------------------------------------------------

const features = [
  {
    emoji: "📚",
    title: "Full Puzzle Archive",
    desc: "Play any past daily puzzle, hundreds of moments to explore at your own pace.",
  },
  {
    emoji: "🛡️",
    title: "Streak Shield",
    desc: "One free miss per month. Your streak is preserved even if life gets in the way.",
  },
  {
    emoji: "📊",
    title: "Personal Stats",
    desc: "Score trends, era accuracy, completion calendar, and all-time personal bests.",
  },
  {
    emoji: "👥",
    title: "Friend Groups",
    desc: "Create private groups, invite friends, and compare daily scores on a shared leaderboard.",
  },
  {
    emoji: "🚫",
    title: "Ad-Free",
    desc: "No ads, ever. A clean, distraction-free experience across all devices.",
  },
  {
    emoji: "⚡",
    title: "Early Access",
    desc: "First look at new features, game modes, and curated event packs as they ship.",
  },
];

// ---------------------------------------------------------------------------
// Pricing card
// ---------------------------------------------------------------------------

interface PricingCardProps {
  plan: "monthly" | "annual";
  price: string;
  period: string;
  badge?: string;
  onSelect: (plan: "monthly" | "annual") => void;
  loading: boolean;
}

function PricingCard({ plan, price, period, badge, onSelect, loading }: PricingCardProps) {
  const isAnnual = plan === "annual";
  return (
    <div
      className={`relative rounded-2xl border p-6 space-y-4 ${
        isAnnual
          ? "border-gold/50 bg-gold/5 ring-2 ring-gold/20"
          : "border-ink/10 bg-white/60"
      } backdrop-blur-sm`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-gold px-3 py-1 text-xs font-sans font-bold text-white shadow">
            {badge}
          </span>
        </div>
      )}

      <div>
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-ink-muted">
          {isAnnual ? "Annual" : "Monthly"}
        </p>
        <div className="flex items-end gap-1 mt-1">
          <span className="font-serif text-4xl font-bold text-ink">{price}</span>
          <span className="font-sans text-sm text-ink-muted pb-1">{period}</span>
        </div>
      </div>

      <button
        onClick={() => onSelect(plan)}
        disabled={loading}
        className={`w-full rounded-2xl py-3.5 font-sans font-semibold transition-colors active:scale-95 disabled:opacity-60 ${
          isAnnual
            ? "bg-gold text-white hover:bg-gold/80"
            : "bg-ink text-parchment hover:bg-ink/80"
        }`}
      >
        {loading ? "Redirecting…" : isAnnual ? "Subscribe Annually" : "Subscribe Monthly"}
      </button>

      {isAnnual && (
        <p className="text-center font-sans text-xs text-ink-muted">
          Best value · $1.25/month · Billed yearly
        </p>
      )}
      {!isAnnual && (
        <p className="text-center font-sans text-xs text-ink-muted">
          Cancel anytime · Billed monthly
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PlusPage() {
  const [loadingPlan, setLoadingPlan] = useState<"monthly" | "annual" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState<boolean | null>(null);

  // Only collected for anonymous users — sent to the server to create the account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      // Show account form if no session at all, or session has no linked email
      setIsAnonymous(!session?.user?.email);
    });
  }, []);

  async function handleSelect(plan: "monthly" | "annual") {
    setError(null);

    // Validate account fields before hitting the API
    if (isAnonymous) {
      if (!email) { setError("Please enter your email address."); return; }
      if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    }

    setLoadingPlan(plan);

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const body: Record<string, string> = { plan };
    if (isAnonymous) { body.email = email; body.password = password; }

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoadingPlan(null);

    if (!res.ok) {
      setError(data?.error ?? "Something went wrong. Please try again.");
      return;
    }

    if (data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-lg space-y-10">
        <NavHeader backHref="/" />

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <PlusBadge size="md" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-ink">circa plus</h1>
          <p className="font-sans text-sm text-ink-muted leading-relaxed max-w-sm mx-auto">
            For history lovers who want to go deeper. Unlock the archive, protect your streak, and track every guess.
          </p>
        </div>

        {/* Feature list */}
        <div className="rounded-2xl border border-ink/10 bg-white/60 divide-y divide-ink/8 backdrop-blur-sm">
          {features.map(({ emoji, title, desc }) => (
            <div key={title} className="flex items-start gap-4 px-5 py-4">
              <span className="text-2xl mt-0.5 flex-shrink-0">{emoji}</span>
              <div>
                <p className="font-sans text-sm font-semibold text-ink">{title}</p>
                <p className="font-sans text-xs text-ink-muted mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Account fields — anonymous users only */}
        {isAnonymous && (
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="font-sans text-sm font-semibold text-ink">create your account</p>
              <p className="font-sans text-xs text-ink-muted">
                Your email and password keep your streak and scores safe across devices.
              </p>
            </div>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-ink/15 bg-white/80 px-4 py-3 font-sans text-sm text-ink placeholder:text-ink-muted/50 outline-none focus:border-gold transition-colors"
            />
            <input
              type="password"
              placeholder="choose a password (8+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              className="w-full rounded-xl border border-ink/15 bg-white/80 px-4 py-3 font-sans text-sm text-ink placeholder:text-ink-muted/50 outline-none focus:border-gold transition-colors"
            />
          </div>
        )}

        {/* Pricing cards */}
        <div className="space-y-4">
          <PricingCard
            plan="annual"
            price="$14.99"
            period="/ year"
            badge="Best value"
            onSelect={handleSelect}
            loading={loadingPlan === "annual"}
          />
          <PricingCard
            plan="monthly"
            price="$2.99"
            period="/ month"
            onSelect={handleSelect}
            loading={loadingPlan === "monthly"}
          />
        </div>

        {error && (
          <p className="text-center font-sans text-sm text-red-600">{error}</p>
        )}

        {/* Trust signals */}
        <div className="text-center space-y-2 pb-4">
          <p className="font-sans text-xs text-ink-muted">
            Payments processed securely by Stripe. Cancel anytime.
          </p>
          <p className="font-sans text-xs text-ink-muted">
            Already have Plus?{" "}
            <Link href="/login?next=/" className="underline hover:text-gold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
