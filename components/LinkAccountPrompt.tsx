"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LinkAccountPrompt() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus]     = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setStatus("loading");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email, password });

    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
      return;
    }

    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-dot-green/30 bg-dot-green/5 p-6 text-center space-y-2">
        <p className="text-2xl">✓</p>
        <p className="font-serif text-lg font-bold text-ink">check your email</p>
        <p className="font-sans text-sm text-ink-muted">
          We sent a confirmation link to your address. Click it to finish linking
          your account - then your streak is preserved across devices and browsers.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-teal/20 bg-cyan/60 p-6 space-y-4">
      <div className="space-y-1">
        <p className="font-serif text-lg font-bold text-ink">protect your streak</p>
        <p className="font-sans text-sm text-ink-muted leading-relaxed">
          As a Plus subscriber, you can link an email to your account so your
          streak is preserved even if you clear your browser or switch devices.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border border-ink/15 bg-surface/80 px-4 py-3 font-sans text-sm text-ink placeholder:text-ink-muted/50 outline-none focus:border-gold transition-colors"
        />
        <input
          type="password"
          placeholder="choose a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full rounded-xl border border-ink/15 bg-surface/80 px-4 py-3 font-sans text-sm text-ink placeholder:text-ink-muted/50 outline-none focus:border-gold transition-colors"
        />

        {status === "error" && (
          <p className="font-sans text-xs text-red-600">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-xl bg-gold py-3 font-sans font-semibold text-teal transition-colors hover:bg-gold/80 active:scale-95 disabled:opacity-60"
        >
          {status === "loading" ? "saving…" : "save my account"}
        </button>
      </form>
    </div>
  );
}
