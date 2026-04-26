"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NavHeader from "@/components/NavHeader";
import PlusBadge from "@/components/PlusBadge";
import { createClient } from "@/lib/supabase/client";

type View = "loading" | "signed-out" | "create" | "forgot" | "signed-in";

interface AccountInfo {
  email: string;
  userId: string;
  isPlus: boolean;
  plan: string | null;
  periodEnd: string | null;
}

export default function AccountPage() {
  const [view, setView] = useState<View>("loading");
  const [account, setAccount] = useState<AccountInfo | null>(null);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Status
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => { loadAccount(); }, []);

  async function loadAccount() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.email) {
      setView("signed-out");
      return;
    }

    const headers = { Authorization: `Bearer ${session.access_token}` };
    const res = await fetch("/api/plus/status", { headers });
    const plusData = res.ok ? await res.json() : null;

    setAccount({
      email: session.user.email,
      userId: session.user.id,
      isPlus: plusData?.isPlus ?? false,
      plan: plusData?.plan ?? null,
      periodEnd: plusData?.currentPeriodEnd ?? null,
    });
    setView("signed-in");
  }

  function clearMessage() { setMessage(null); }

  // -------------------------------------------------------------------------
  // Sign in
  // -------------------------------------------------------------------------
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); clearMessage();
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) { setMessage({ type: "error", text: error.message }); setBusy(false); return; }
    setPassword("");
    loadAccount();
    setBusy(false);
  }

  // -------------------------------------------------------------------------
  // Create account
  // -------------------------------------------------------------------------
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords don't match." }); return;
    }
    setBusy(true); clearMessage();
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    let error;
    if (session?.user && !session.user.email) {
      // Anonymous session — link email to preserve progress
      ({ error } = await supabase.auth.updateUser({ email, password }));
    } else {
      // No session — create fresh account
      ({ error } = await supabase.auth.signUp({ email, password }));
    }

    if (error) { setMessage({ type: "error", text: error.message }); setBusy(false); return; }
    setMessage({ type: "success", text: "Account created! Check your email to confirm your address." });
    setBusy(false);
  }

  // -------------------------------------------------------------------------
  // Forgot / reset password
  // -------------------------------------------------------------------------
  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); clearMessage();
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account`,
    });
    if (error) { setMessage({ type: "error", text: error.message }); setBusy(false); return; }
    setMessage({ type: "success", text: "Password reset email sent — check your inbox." });
    setBusy(false);
  }

  // -------------------------------------------------------------------------
  // Change password (signed in)
  // -------------------------------------------------------------------------
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords don't match." }); return;
    }
    setBusy(true); clearMessage();
    const { error } = await createClient().auth.updateUser({ password: newPassword });
    if (error) { setMessage({ type: "error", text: error.message }); setBusy(false); return; }
    setNewPassword(""); setConfirmPassword("");
    setMessage({ type: "success", text: "Password updated." });
    setBusy(false);
  }

  // -------------------------------------------------------------------------
  // Manage subscription (Stripe portal)
  // -------------------------------------------------------------------------
  async function handleManageSubscription() {
    setBusy(true); clearMessage();
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setMessage({ type: "error", text: data.error ?? "Could not open subscription portal." }); return; }
    window.location.href = data.url;
  }

  // -------------------------------------------------------------------------
  // Sign out
  // -------------------------------------------------------------------------
  async function handleSignOut() {
    await createClient().auth.signOut();
    setAccount(null);
    setView("signed-out");
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  const inputClass = "w-full rounded-xl border border-ink/15 bg-surface/80 px-4 py-3 font-sans text-sm text-ink placeholder:text-ink-muted/50 outline-none focus:border-gold transition-colors";
  const btnPrimary = "btn-primary w-full py-3.5";

  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-lg space-y-8">
        <NavHeader backHref="/" />

        <div className="space-y-1">
          <h1 className="font-serif text-2xl font-bold text-teal">account</h1>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Loading                                                           */}
        {/* ---------------------------------------------------------------- */}
        {view === "loading" && (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-gold" />
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Signed out — sign in or switch view                              */}
        {/* ---------------------------------------------------------------- */}
        {view === "signed-out" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-ink/10 bg-surface/60 p-6 space-y-4">
              <p className="font-sans text-sm font-semibold text-ink">sign in</p>
              <form onSubmit={handleSignIn} className="space-y-3">
                <input type="email" placeholder="your@email.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={inputClass} />
                <input type="password" placeholder="password" value={password}
                  onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className={inputClass} />
                {message && (
                  <p className={`font-sans text-xs ${message.type === "error" ? "text-red-600" : "text-green-700"}`}>{message.text}</p>
                )}
                <button type="submit" disabled={busy} className={btnPrimary}>
                  {busy ? "signing in…" : "sign in"}
                </button>
              </form>
              <button onClick={() => { setView("forgot"); clearMessage(); }}
                className="w-full text-center font-sans text-xs text-ink-muted hover:text-ink underline transition-colors">
                forgot password?
              </button>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-surface/60 p-6 space-y-3">
              <p className="font-sans text-sm font-semibold text-ink">new to circa+?</p>
              <p className="font-sans text-xs text-ink-muted">create a free account to save your progress, then subscribe to unlock plus features.</p>
              <button onClick={() => { setView("create"); clearMessage(); }}
                className="w-full rounded-2xl border border-ink/15 bg-teal py-3 font-sans text-sm font-semibold text-parchment hover:bg-teal/80 transition-colors">
                create account
              </button>
              <Link href="/plus" className="block w-full text-center font-sans text-sm font-semibold text-gold hover:text-gold/80 transition-colors">
                learn about circa+ →
              </Link>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Create account                                                    */}
        {/* ---------------------------------------------------------------- */}
        {view === "create" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-ink/10 bg-surface/60 p-6 space-y-4">
              <p className="font-sans text-sm font-semibold text-ink">create account</p>
              <form onSubmit={handleCreate} className="space-y-3">
                <input type="email" placeholder="your@email.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={inputClass} />
                <input type="password" placeholder="password (8+ characters)" value={password}
                  onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" className={inputClass} />
                <input type="password" placeholder="confirm password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" className={inputClass} />
                {message && (
                  <p className={`font-sans text-xs ${message.type === "error" ? "text-red-600" : "text-green-700"}`}>{message.text}</p>
                )}
                <button type="submit" disabled={busy} className={btnPrimary}>
                  {busy ? "creating account…" : "create account"}
                </button>
              </form>
              <button onClick={() => { setView("signed-out"); clearMessage(); }}
                className="w-full text-center font-sans text-xs text-ink-muted hover:text-ink underline transition-colors">
                already have an account? sign in
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Forgot password                                                   */}
        {/* ---------------------------------------------------------------- */}
        {view === "forgot" && (
          <div className="rounded-2xl border border-ink/10 bg-surface/60 p-6 space-y-4">
            <div className="space-y-1">
              <p className="font-sans text-sm font-semibold text-ink">reset password</p>
              <p className="font-sans text-xs text-ink-muted">Enter your email and we'll send a reset link.</p>
            </div>
            <form onSubmit={handleForgot} className="space-y-3">
              <input type="email" placeholder="your@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={inputClass} />
              {message && (
                <p className={`font-sans text-xs ${message.type === "error" ? "text-red-600" : "text-green-700"}`}>{message.text}</p>
              )}
              <button type="submit" disabled={busy} className={btnPrimary}>
                {busy ? "sending…" : "send reset email"}
              </button>
            </form>
            <button onClick={() => { setView("signed-out"); clearMessage(); }}
              className="w-full text-center font-sans text-xs text-ink-muted hover:text-ink underline transition-colors">
              back to sign in
            </button>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Signed in                                                         */}
        {/* ---------------------------------------------------------------- */}
        {view === "signed-in" && account && (
          <div className="space-y-4">
            {/* Account info */}
            <div className="rounded-2xl border border-ink/10 bg-surface/60 p-6 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-sans text-xs text-ink-muted uppercase tracking-widest font-semibold">signed in as</p>
                  <p className="font-sans text-sm font-semibold text-ink mt-0.5">{account.email}</p>
                </div>
                {account.isPlus && <PlusBadge size="sm" />}
              </div>

              {account.isPlus ? (
                <div className="space-y-1 pt-1 border-t border-ink/8">
                  <p className="font-sans text-xs text-ink-muted">
                    {account.plan === "annual" ? "annual plan" : "monthly plan"}
                    {account.periodEnd && (
                      <> · renews {new Date(account.periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</>
                    )}
                  </p>
                </div>
              ) : (
                <div className="pt-1 border-t border-ink/8">
                  <Link href="/plus" className="font-sans text-sm font-semibold text-gold hover:text-gold/80 transition-colors">
                    upgrade to Circa+ →
                  </Link>
                </div>
              )}
            </div>

            {/* Subscription management */}
            {account.isPlus && (
              <button onClick={handleManageSubscription} disabled={busy}
                className={btnPrimary}>
                {busy ? "opening…" : "manage subscription"}
              </button>
            )}

            {/* Change password */}
            <div className="rounded-2xl border border-ink/10 bg-surface/60 p-6 space-y-4">
              <p className="font-sans text-sm font-semibold text-ink">change password</p>
              <form onSubmit={handleChangePassword} className="space-y-3">
                <input type="password" placeholder="new password (8+ characters)" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} required minLength={8} autoComplete="new-password" className={inputClass} />
                <input type="password" placeholder="confirm new password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" className={inputClass} />
                {message && (
                  <p className={`font-sans text-xs ${message.type === "error" ? "text-red-600" : "text-green-700"}`}>{message.text}</p>
                )}
                <button type="submit" disabled={busy} className={btnPrimary}>
                  {busy ? "updating…" : "update password"}
                </button>
              </form>
            </div>

            {/* Sign out */}
            <button onClick={handleSignOut}
              className={btnPrimary}>
              sign out
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
