"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import NavHeader from "@/components/NavHeader";
import { formatPuzzleDate, todayDate } from "@/lib/dates";
import type { Group, GroupMember, GroupScoresResponse } from "@/types";

export default function GroupPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const groupId = params.id;

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [scores, setScores] = useState<GroupScoresResponse | null>(null);
  const [viewerUserId, setViewerUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function authHeader(): Promise<Record<string, string>> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};
  }

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) setViewerUserId(session.user.id);

    const headers = session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {} as Record<string, string>;

    const [groupRes, scoresRes] = await Promise.all([
      fetch(`/api/groups/${groupId}`, { headers }),
      fetch(`/api/groups/${groupId}/scores`, { headers }),
    ]);

    if (!groupRes.ok) {
      if (groupRes.status === 404) router.replace("/groups");
      else setError("Failed to load group.");
      return;
    }

    const groupData = await groupRes.json();
    setGroup(groupData.group);
    setMembers(groupData.members);

    if (scoresRes.ok) {
      setScores(await scoresRes.json());
    }
  }, [groupId, router]);

  useEffect(() => { load(); }, [load]);

  async function handleCopyCode() {
    if (!group) return;
    const link = `${window.location.origin}/groups/join?code=${group.inviteCode}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      await navigator.clipboard.writeText(group.inviteCode);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLeave() {
    if (!group) return;
    setLeaving(true);
    const headers = await authHeader();
    const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE", headers });
    if (res.ok) {
      router.replace("/groups");
    } else {
      setLeaving(false);
      setError("Failed to leave group.");
    }
  }

  if (error) {
    return (
      <PageShell>
        <p className="text-center font-serif text-xl text-ink py-12">{error}</p>
        <a href="/groups" className="block text-center font-sans text-sm text-ink-muted underline">
          back to groups
        </a>
      </PageShell>
    );
  }

  if (!group) {
    return (
      <PageShell>
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-gold" />
        </div>
      </PageShell>
    );
  }

  const isOwner = viewerUserId === group.ownerId;
  const dateLabel = scores ? formatPuzzleDate(scores.puzzleDate) : formatPuzzleDate(todayDate());

  return (
    <PageShell>
      {/* Group header */}
      <div className="space-y-1">
        <h1 className="font-serif text-2xl font-bold text-ink">{group.name}</h1>
        <p className="font-sans text-sm text-ink-muted">{dateLabel}</p>
      </div>

      {/* Scoreboard */}
      <section className="rounded-2xl border border-ink/10 bg-white/60 overflow-hidden">
        {scores && !scores.viewerHasPlayed && (
          <div className="px-5 py-3 bg-gold/10 border-b border-gold/20">
            <p className="font-sans text-xs text-gold font-semibold text-center">
              play today&apos;s puzzle to see your friends&apos; scores
            </p>
          </div>
        )}

        {scores?.members.map((m, i) => (
          <div
            key={m.userId}
            className={`flex items-center gap-3 px-5 py-3.5 border-b border-ink/5 last:border-0 ${
              m.userId === viewerUserId ? "bg-gold/5" : ""
            }`}
          >
            {/* Rank */}
            <span className="w-5 font-sans text-xs text-ink-muted tabular-nums shrink-0">
              {m.totalScore !== null ? `${i + 1}.` : "–"}
            </span>

            {/* Name + emoji row */}
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm font-semibold text-ink truncate">{m.displayName}</p>
              {m.emojiRow && (
                <p className="font-sans text-xs tracking-wide mt-0.5">{m.emojiRow}</p>
              )}
              {m.totalScore === null && (
                <p className="font-sans text-xs text-ink-muted/60 mt-0.5">hasn&apos;t played yet</p>
              )}
            </div>

            {/* Score */}
            {m.totalScore !== null && (
              <span className="font-serif text-lg font-bold text-ink tabular-nums shrink-0">
                {m.totalScore}
              </span>
            )}
          </div>
        ))}

        {(!scores || scores.members.length === 0) && (
          <p className="px-5 py-6 text-center font-sans text-sm text-ink-muted">
            no scores yet for today
          </p>
        )}
      </section>

      {/* Members */}
      <section className="space-y-2">
        <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-ink-muted">
          members ({group.memberCount})
        </h2>
        <div className="rounded-2xl border border-ink/10 bg-white/60 divide-y divide-ink/5">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center justify-between px-5 py-3">
              <span className="font-sans text-sm text-ink">{m.displayName}</span>
              <div className="flex items-center gap-2">
                {m.isOwner && (
                  <span className="font-sans text-xs text-gold font-semibold">owner</span>
                )}
                {isOwner && !m.isOwner && (
                  <RemoveMemberButton
                    groupId={groupId}
                    userId={m.userId}
                    onRemoved={load}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Invite code */}
      <section className="rounded-2xl border border-ink/10 bg-white/60 p-5 space-y-3">
        <div className="space-y-0.5">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-ink-muted">
            invite friends
          </p>
          <p className="font-sans text-xs text-ink-muted">
            share this code or link — only Circa+ members can join
          </p>
        </div>
        <div className="flex items-center gap-3">
          <code className="flex-1 rounded-xl border border-ink/15 bg-parchment px-4 py-2.5 font-mono text-sm font-bold tracking-widest text-ink uppercase">
            {group.inviteCode}
          </code>
          <button
            onClick={handleCopyCode}
            className="rounded-xl bg-ink px-4 py-2.5 font-sans text-sm font-semibold text-parchment hover:bg-ink/80 transition-colors shrink-0"
          >
            {copied ? "copied!" : "copy link"}
          </button>
        </div>
      </section>

      {/* Danger zone */}
      <div className="pt-2">
        {isOwner ? (
          <button
            onClick={handleLeave}
            disabled={leaving}
            className="w-full rounded-2xl border border-red-200 bg-red-50 py-3 font-sans text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {leaving ? "deleting…" : "delete group"}
          </button>
        ) : (
          <button
            onClick={handleLeave}
            disabled={leaving}
            className="w-full rounded-2xl border border-ink/15 bg-white/60 py-3 font-sans text-sm text-ink-muted hover:text-ink transition-colors disabled:opacity-50"
          >
            {leaving ? "leaving…" : "leave group"}
          </button>
        )}
      </div>
    </PageShell>
  );
}

function RemoveMemberButton({
  groupId,
  userId,
  onRemoved,
}: {
  groupId: string;
  userId: string;
  onRemoved: () => void;
}) {
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    setRemoving(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};

    // Call the remove-member API (owner removing someone else)
    await fetch(`/api/groups/${groupId}/members/${userId}`, { method: "DELETE", headers });
    onRemoved();
    setRemoving(false);
  }

  return (
    <button
      onClick={handleRemove}
      disabled={removing}
      className="font-sans text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
    >
      remove
    </button>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-lg space-y-6">
        <NavHeader backHref="/groups" />
        {children}
      </div>
    </main>
  );
}
