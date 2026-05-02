"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NavHeader from "@/components/NavHeader";
import PlusBadge from "@/components/PlusBadge";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Feature icons (SVG, consistent with nav icon style)
// ---------------------------------------------------------------------------

const ArchiveIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <rect x="2" y="2.5" width="16" height="3" rx="1" opacity=".45"/>
    <path d="M2.5 6.5h15v10a1 1 0 01-1 1h-13a1 1 0 01-1-1v-10zm4 3.5h7a.5.5 0 000-1h-7a.5.5 0 000 1z"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="M10 1.5L3 4.5v5.25C3 13.5 6.1 16.8 10 18c3.9-1.2 7-4.5 7-8.25V4.5L10 1.5z"/>
  </svg>
);

const StatsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <rect x="3" y="11" width="3" height="6" rx=".5"/>
    <rect x="8.5" y="7" width="3" height="10" rx=".5"/>
    <rect x="14" y="3" width="3" height="14" rx=".5"/>
  </svg>
);

const GroupsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <circle cx="7.5" cy="6" r="2.5"/>
    <path d="M2 16c0-3.04 2.46-5.5 5.5-5.5S13 12.96 13 16H2z"/>
    <circle cx="14" cy="5.5" r="2" opacity=".5"/>
    <path d="M12.5 12c.46-.32 1-.5 1.5-.5 2.21 0 4 1.79 4 4.5h-3.5c0-1.52-.77-2.86-2-3.97z" opacity=".5"/>
  </svg>
);

const NoAdsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M10 2a8 8 0 100 16A8 8 0 0010 2zM4.93 4.93a6 6 0 018.49 8.49L4.93 4.93zm1.41 9.9a6 6 0 008.49-8.49L6.34 14.83z"/>
  </svg>
);

const LightningIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="M11 2L4.5 11.5H10L8.5 18 16 8.5H10.5L11 2z"/>
  </svg>
);

// ---------------------------------------------------------------------------
// Feature list
// ---------------------------------------------------------------------------

const features = [
  {
    icon: <ArchiveIcon />,
    title: "full puzzle archive",
    desc: "play any past daily puzzle, hundreds of moments to explore at your own pace.",
  },
  {
    icon: <ShieldIcon />,
    title: "streak shield",
    desc: "one free miss per month. your streak is preserved even if life gets in the way.",
  },
  {
    icon: <StatsIcon />,
    title: "personal stats",
    desc: "score trends, era accuracy, completion calendar, and all-time personal bests.",
  },
  {
    icon: <GroupsIcon />,
    title: "friend groups",
    desc: "create private groups, invite friends, and compare daily scores on a shared leaderboard.",
  },
  {
    icon: <NoAdsIcon />,
    title: "ad-free",
    desc: "no ads, ever. a clean, distraction-free experience across all devices.",
  },
  {
    icon: <LightningIcon />,
    title: "early access",
    desc: "first look at new features, game modes, and curated event packs as they ship.",
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
  disabled?: boolean;
}

function PricingCard({ plan, price, period, badge, onSelect, loading, disabled }: PricingCardProps) {
  const isAnnual = plan === "annual";
  return (
    <div
      className={`relative rounded-2xl border p-6 space-y-4 ${
        isAnnual
          ? "border-gold/50 bg-cyan/60 ring-2 ring-gold/20"
          : "border-ink/10 bg-surface/60"
      } backdrop-blur-sm`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-gold px-3 py-1 text-xs font-sans font-bold text-teal shadow">
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
        disabled={loading || disabled}
        className="btn-primary w-full py-3.5"
      >
        {loading ? "Redirecting…" : isAnnual ? "subscribe annually" : "subscribe monthly"}
      </button>

      {isAnnual && (
        <p className="text-center font-sans text-xs text-ink-muted">
          best value · $1.25/month · billed yearly
        </p>
      )}
      {!isAnnual && (
        <p className="text-center font-sans text-xs text-ink-muted">
          cancel anytime · billed monthly
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
  const [ageConfirmed, setAgeConfirmed] = useState(false);

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

    // COPPA age gate
    if (!ageConfirmed) { setError("Please confirm you are 13 or older to continue."); return; }

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
          <h1 className="font-serif text-4xl font-bold text-teal">circa+</h1>
          <p className="font-sans text-sm text-ink-muted leading-relaxed max-w-sm mx-auto">
            for history lovers who want to go deeper. unlock the archive, protect your streak, and track every guess.
          </p>
        </div>

        {/* Feature list */}
        <div className="rounded-2xl border border-ink/10 bg-surface/60 divide-y divide-ink/8 backdrop-blur-sm">
          {features.map(({ icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4 px-5 py-4">
              <span className="w-5 h-5 mt-0.5 flex-shrink-0 text-teal">{icon}</span>
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
                your email and password keep your streak and scores safe across devices.
              </p>
            </div>
            <div className="space-y-1">
              <label htmlFor="plus-email" className="font-sans text-xs font-semibold text-ink-muted">email</label>
              <input
                id="plus-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded-xl border border-ink/15 bg-surface/80 px-4 py-3 font-sans text-sm text-ink placeholder:text-ink-muted/50 outline-none focus:border-gold transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="plus-password" className="font-sans text-xs font-semibold text-ink-muted">password</label>
              <input
                id="plus-password"
                type="password"
                placeholder="8+ characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-xl border border-ink/15 bg-surface/80 px-4 py-3 font-sans text-sm text-ink placeholder:text-ink-muted/50 outline-none focus:border-gold transition-colors"
              />
            </div>
          </div>
        )}

        {/* Age gate — COPPA */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={ageConfirmed}
            onChange={(e) => { setAgeConfirmed(e.target.checked); setError(null); }}
            data-testid="age-gate-checkbox"
            className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-ink/30 accent-teal cursor-pointer"
          />
          <span className="font-sans text-xs text-ink-muted leading-relaxed group-hover:text-ink transition-colors">
            I confirm that I am 13 years of age or older.
          </span>
        </label>

        {/* Pricing cards */}
        <div className="space-y-4">
          <PricingCard
            plan="annual"
            price="$14.99"
            period="/ year"
            badge="best value"
            onSelect={handleSelect}
            loading={loadingPlan === "annual"}
            disabled={!ageConfirmed}
          />
          <PricingCard
            plan="monthly"
            price="$2.99"
            period="/ month"
            onSelect={handleSelect}
            loading={loadingPlan === "monthly"}
            disabled={!ageConfirmed}
          />
        </div>

        {error && (
          <p className="text-center font-sans text-sm text-red-600">{error}</p>
        )}

        {/* Trust signals */}
        <div className="text-center space-y-2 pb-4">
          <p className="font-sans text-xs text-ink-muted">
            payments processed securely by Stripe. cancel anytime.
          </p>
          <p className="font-sans text-xs text-ink-muted">
            already have plus?{" "}
            <Link href="/login?next=/" className="underline hover:text-gold transition-colors">
              sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
