"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import NavHeader from "@/components/NavHeader";

function JoinPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? "";

  const [groupName, setGroupName] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Preview the group name from the invite code (no auth needed for the name lookup)
  useEffect(() => {
    if (!code) return;
    // We'll show the code and let them join — name is revealed after joining
    setGroupName(null);
  }, [code]);

  async function handleJoin() {
    setJoining(true);
    setError(null);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setError("You need to be signed in to join a group.");
      setJoining(false);
      return;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };

    const res = await fetch("/api/groups/join", {
      method: "POST",
      headers,
      body: JSON.stringify({ inviteCode: code }),
    });

    const data = await res.json();

    if (res.status === 404) { setNotFound(true); setJoining(false); return; }
    if (!res.ok) { setError(data.error ?? "Failed to join group."); setJoining(false); return; }

    router.replace(`/groups/${data.id}`);
  }

  if (!code) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="font-serif text-xl text-ink">no invite code provided</p>
        <a href="/groups" className="font-sans text-sm text-ink-muted underline">go to groups</a>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="font-serif text-xl text-ink">invite code not found</p>
        <p className="font-sans text-sm text-ink-muted">double-check the link and try again</p>
        <a href="/groups" className="font-sans text-sm text-ink-muted underline">go to groups</a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-surface/60 p-6 space-y-5">
      <div className="text-center space-y-2">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-ink-muted">
          you&apos;re invited
        </p>
        <p className="font-serif text-xl text-ink">
          join group{groupName ? `: ${groupName}` : ""}
        </p>
        <code className="inline-block rounded-lg bg-parchment border border-ink/10 px-3 py-1 font-mono text-sm font-bold tracking-widest text-ink uppercase">
          {code}
        </code>
      </div>

      {error && <p className="font-sans text-sm text-red-600 text-center">{error}</p>}

      {error?.includes("Circa+") && (
        <a
          href="/plus"
          className="block w-full rounded-2xl bg-gold py-3 font-sans font-semibold text-teal text-center hover:bg-gold/80 transition-colors"
        >
          upgrade to Circa+
        </a>
      )}

      <button
        onClick={handleJoin}
        disabled={joining}
        className="w-full rounded-2xl bg-gold py-4 font-sans font-semibold text-teal transition-colors hover:bg-gold/80 active:scale-95 disabled:opacity-50"
      >
        {joining ? "joining…" : "join group"}
      </button>

      <a
        href="/groups"
        className="block text-center font-sans text-sm text-ink-muted underline"
      >
        go to my groups
      </a>
    </div>
  );
}

export default function JoinPage() {
  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-lg space-y-6">
        <NavHeader backHref="/groups" />
        <Suspense fallback={
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-gold" />
          </div>
        }>
          <JoinPageInner />
        </Suspense>
      </div>
    </main>
  );
}
