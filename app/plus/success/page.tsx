"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import NavHeader from "@/components/NavHeader";
import PlusBadge from "@/components/PlusBadge";
import { createClient } from "@/lib/supabase/client";

function SuccessInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const activated = searchParams.get("activated");

  const [status, setStatus] = useState<"loading" | "ready" | "signin" | "error">("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState("");

  useEffect(() => {
    // If we just came back from the magic link, user is now signed in
    if (activated === "1") {
      setStatus("ready");
      return;
    }

    if (!sessionId) {
      setStatus("ready");
      return;
    }

    async function verify() {
      // Get current session token to pass along
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {};

      const res = await fetch(`/api/plus/verify-checkout?session_id=${sessionId}`, { headers });
      if (!res.ok) {
        setStatus("error");
        return;
      }

      const data = await res.json();

      if (data.alreadySignedIn) {
        setStatus("ready");
      } else if (data.magicLinkUrl) {
        // Redirect to magic link — Supabase will sign them in and bounce
        // back to /plus/success?activated=1
        window.location.href = data.magicLinkUrl;
      } else if (data.email) {
        // Magic link unavailable — fall back to manual sign-in form
        setEmail(data.email);
        setStatus("signin");
      } else {
        setStatus("ready");
      }
    }

    verify();
  }, [sessionId, activated]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSigningIn(true);
    setSignInError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setSignInError(error.message);
      setSigningIn(false);
      return;
    }
    setStatus("ready");
  }

  if (status === "loading") {
    return (
      <div className="flex justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-gold" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center space-y-4 py-12">
        <p className="font-serif text-xl text-ink">something went wrong</p>
        <p className="font-sans text-sm text-ink-muted">
          Your payment was received but we couldn&apos;t activate Plus automatically.
          Please contact support with your email address.
        </p>
        <Link href="/" className="block font-sans text-sm text-ink-muted underline">
          back to home
        </Link>
      </div>
    );
  }

  if (status === "signin") {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center text-gold">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z"/>
              <path d="M5 2l.9 2.7L8.5 5.5l-2.6.8L5 9l-.9-2.7L1.5 5.5l2.6-.8L5 2zM19 15l.9 2.7 2.6.8-2.6.8-.9 2.7-.9-2.7-2.6-.8 2.6-.8L19 15z" opacity=".5"/>
            </svg>
          </div>
          <div className="flex justify-center">
            <PlusBadge size="md" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-teal">payment successful!</h1>
          <p className="font-sans text-sm text-ink-muted">
            Sign in to activate your Plus features.
          </p>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-surface/60 p-6 space-y-4">
          <form onSubmit={handleSignIn} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-ink/15 bg-surface/80 px-4 py-3 font-sans text-sm text-ink placeholder:text-ink-muted/50 outline-none focus:border-gold transition-colors"
            />
            <input
              type="password"
              placeholder="your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-ink/15 bg-surface/80 px-4 py-3 font-sans text-sm text-ink placeholder:text-ink-muted/50 outline-none focus:border-gold transition-colors"
            />
            {signInError && (
              <p className="font-sans text-xs text-red-600">{signInError}</p>
            )}
            <button
              type="submit"
              disabled={signingIn}
              className="w-full rounded-2xl bg-gold py-3.5 font-sans font-semibold text-teal transition-colors hover:bg-gold/80 active:scale-95 disabled:opacity-60"
            >
              {signingIn ? "signing in…" : "sign in to activate Plus"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // status === "ready"
  return (
    <div className="text-center space-y-6 py-12">
      <div className="flex justify-center text-gold">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2L6 9l6 13 6-13-6-7zM8.5 9H15.5L12 20 8.5 9zM7.2 8L12 3.8 16.8 8H7.2z" opacity=".9"/>
        </svg>
      </div>
      <div className="space-y-2">
        <div className="flex justify-center">
          <PlusBadge size="md" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-teal">welcome to plus</h1>
        <p className="font-sans text-sm text-ink-muted leading-relaxed max-w-xs mx-auto">
          Your subscription is active. The full archive, stats, streak shields, and groups are now unlocked.
        </p>
      </div>

      <div className="space-y-3">
        <Link
          href="/archive"
          className="block w-full rounded-2xl bg-gold py-4 font-sans font-semibold text-teal transition-colors hover:bg-gold/80 text-center"
        >
          Browse the Archive →
        </Link>
        <Link
          href="/"
          className="block w-full rounded-2xl border border-ink/10 bg-surface/60 py-4 font-sans font-semibold text-ink transition-colors hover:bg-ink/5 text-center"
        >
          Play Today&apos;s Puzzle
        </Link>
      </div>
    </div>
  );
}

export default function PlusSuccessPage() {
  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-lg space-y-8">
        <NavHeader />
        <Suspense fallback={
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-gold" />
          </div>
        }>
          <SuccessInner />
        </Suspense>
      </div>
    </main>
  );
}
