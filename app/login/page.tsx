"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import NavHeader from "@/components/NavHeader";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setStatus("error");
      return;
    }

    router.replace(next);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-serif text-2xl font-bold text-teal">sign in</h1>
        <p className="font-sans text-sm text-ink-muted">
          Access your Circa+ features and saved progress.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full rounded-xl border border-ink/15 bg-surface/80 px-4 py-3 font-sans text-sm text-ink placeholder:text-ink-muted/50 outline-none focus:border-gold transition-colors"
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full rounded-xl border border-ink/15 bg-surface/80 px-4 py-3 font-sans text-sm text-ink placeholder:text-ink-muted/50 outline-none focus:border-gold transition-colors"
        />

        {status === "error" && (
          <p className="font-sans text-xs text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-2xl bg-gold py-3.5 font-sans font-semibold text-teal transition-colors hover:bg-gold/80 active:scale-95 disabled:opacity-60"
        >
          {status === "loading" ? "signing in…" : "sign in"}
        </button>
      </form>

      <div className="text-center space-y-2">
        <p className="font-sans text-xs text-ink-muted">
          Don&apos;t have Plus yet?{" "}
          <Link href="/plus" className="underline hover:text-gold transition-colors">
            Learn more
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-lg space-y-8">
        <NavHeader backHref="/" />
        <Suspense fallback={<div className="h-40" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
