"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import NavHeader from "@/components/NavHeader";
import PlusGate from "@/components/PlusGate";
import type { Group } from "@/types";

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [newName, setNewName] = useState("");
  const [inviteInput, setInviteInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  async function authHeader(): Promise<Record<string, string>> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};
  }

  async function load() {
    const headers = await authHeader();
    const res = await fetch("/api/groups", { headers });
    if (res.status === 403) { setLocked(true); return; }
    if (!res.ok) { setError("Failed to load groups."); return; }
    setGroups(await res.json());
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setCreating(true);
    try {
      const headers = await authHeader();
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "Failed to create group."); return; }
      setNewName("");
      router.push(`/groups/${data.id}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setJoining(true);
    try {
      const headers = await authHeader();
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ inviteCode: inviteInput.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "Failed to join group."); return; }
      router.push(`/groups/${data.id}`);
    } finally {
      setJoining(false);
    }
  }

  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-lg space-y-6">
        <NavHeader backHref="/" />

        <div className="space-y-1">
          <h1 className="font-serif text-3xl font-bold text-teal">groups</h1>
          <p className="font-sans text-sm text-ink-muted">play with friends and compare scores</p>
        </div>

        {locked && <PlusGate locked feature="friend groups" />}

        {error && (
          <p className="font-sans text-sm text-red-600">{error}</p>
        )}

        {!locked && !error && !groups && (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-gold" />
          </div>
        )}

        {groups !== null && (
          <>
            {/* Your groups */}
            {groups.length > 0 ? (
              <section className="space-y-3">
                <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-ink-muted">
                  your groups
                </h2>
                <div className="space-y-2">
                  {groups.map((g) => (
                    <a
                      key={g.id}
                      href={`/groups/${g.id}`}
                      className="flex items-center justify-between rounded-2xl border border-ink/10 bg-surface/60 px-5 py-4 hover:bg-surface/80 transition-colors group"
                    >
                      <div>
                        <p className="font-serif text-base font-bold text-ink">{g.name}</p>
                        <p className="font-sans text-xs text-ink-muted mt-0.5">
                          {g.memberCount} {g.memberCount === 1 ? "member" : "members"}
                        </p>
                      </div>
                      <span className="text-ink-muted group-hover:translate-x-0.5 transition-transform">→</span>
                    </a>
                  ))}
                </div>
              </section>
            ) : (
              <div className="rounded-2xl border border-ink/10 bg-surface/60 p-6 text-center space-y-1">
                <p className="font-serif text-base text-ink">no groups yet</p>
                <p className="font-sans text-sm text-ink-muted">create one below or enter a friend&apos;s invite code</p>
              </div>
            )}

            {/* Form error */}
            {formError && (
              <p className="font-sans text-sm text-red-600 text-center">{formError}</p>
            )}

            {/* Create a group */}
            <section className="space-y-3">
              <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-ink-muted">
                create a group
              </h2>
              <form onSubmit={handleCreate} className="space-y-3">
                <input
                  type="text"
                  placeholder="group name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={40}
                  required
                  className="w-full rounded-xl border border-ink/15 bg-surface/80 px-4 py-3 font-sans text-sm text-ink placeholder:text-ink-muted/50 outline-none focus:border-gold transition-colors"
                />
                <button
                  type="submit"
                  disabled={creating || newName.trim().length < 2}
                  className="btn-primary w-full py-3"
                >
                  {creating ? "creating…" : "create group"}
                </button>
              </form>
            </section>

            {/* Join a group */}
            <section className="space-y-3">
              <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-ink-muted">
                join a group
              </h2>
              <form onSubmit={handleJoin} className="space-y-3">
                <input
                  type="text"
                  placeholder="invite code"
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value)}
                  maxLength={8}
                  required
                  className="w-full rounded-xl border border-ink/15 bg-surface/80 px-4 py-3 font-sans text-sm text-ink placeholder:text-ink-muted/50 outline-none focus:border-gold transition-colors font-mono tracking-widest uppercase"
                />
                <button
                  type="submit"
                  disabled={joining || inviteInput.trim().length < 4}
                  className="btn-primary w-full py-3"
                >
                  {joining ? "joining…" : "join group"}
                </button>
              </form>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
