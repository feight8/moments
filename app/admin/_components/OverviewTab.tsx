import { createServiceClient } from "@/lib/supabase/server";
import { todayDate, formatPuzzleDate } from "@/lib/dates";
import CopyButton from "./CopyButton";

export default async function OverviewTab() {
  const serviceClient = createServiceClient();
  const today = todayDate();

  const [
    { count: totalGames },
    { count: activeSubscribers },
    { count: totalGroups },
    { data: todayRows },
  ] = await Promise.all([
    serviceClient.from("user_results").select("*", { count: "exact", head: true }),
    serviceClient.from("user_plus").select("*", { count: "exact", head: true }).eq("status", "active"),
    serviceClient.from("groups").select("*", { count: "exact", head: true }),
    serviceClient
      .from("user_results")
      .select("total_score")
      .eq("puzzle_date", today)
      .is("category", null),
  ]);

  const todayScores = ((todayRows ?? []) as { total_score: number }[]).map((r) => r.total_score);
  const todayPlayers = todayScores.length;
  const todayTopScore = todayPlayers > 0 ? Math.max(...todayScores) : null;
  const todayAvg = todayPlayers > 0
    ? Math.round(todayScores.reduce((s, v) => s + v, 0) / todayPlayers)
    : null;
  const todayPerfects = todayScores.filter((s) => s === 550).length;

  const socialLines = [
    `today on circa — ${formatPuzzleDate(today)}`,
    `${todayPlayers} ${todayPlayers === 1 ? "player" : "players"} played`,
    todayTopScore !== null ? `top score: ${todayTopScore} / 500` : "",
    todayPerfects > 0 ? `💎 ${todayPerfects} perfect ${todayPerfects === 1 ? "game" : "games"}` : "",
    todayAvg !== null ? `avg score: ${todayAvg}` : "",
    "",
    "play at circagame.com",
  ].filter((l) => l !== undefined);
  const socialText = socialLines.join("\n");

  return (
    <div className="space-y-4">
      {/* App stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-ink/10 bg-surface/60 p-4 text-center backdrop-blur-sm">
          <p className="font-recoleta text-[10px] font-semibold uppercase tracking-widest text-ink-muted mb-1">
            games played
          </p>
          <p className="font-recoleta text-2xl font-bold text-teal dark:text-ink">
            {(totalGames ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-surface/60 p-4 text-center backdrop-blur-sm">
          <p className="font-recoleta text-[10px] font-semibold uppercase tracking-widest text-ink-muted mb-1">
            plus members
          </p>
          <p className="font-recoleta text-2xl font-bold text-gold">
            {activeSubscribers ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-surface/60 p-4 text-center backdrop-blur-sm">
          <p className="font-recoleta text-[10px] font-semibold uppercase tracking-widest text-ink-muted mb-1">
            today&apos;s players
          </p>
          <p className="font-recoleta text-2xl font-bold text-teal dark:text-ink">
            {todayPlayers}
          </p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-surface/60 p-4 text-center backdrop-blur-sm">
          <p className="font-recoleta text-[10px] font-semibold uppercase tracking-widest text-ink-muted mb-1">
            groups
          </p>
          <p className="font-recoleta text-2xl font-bold text-teal dark:text-ink">
            {totalGroups ?? 0}
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div>
        <p className="font-recoleta text-xs font-semibold uppercase tracking-widest text-ink-muted mb-3">
          quick links
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { href: "/stats",         label: "stats" },
            { href: "/archive",       label: "archive" },
            { href: "/groups",        label: "groups" },
            { href: "/plus",          label: "circa+" },
            { href: "/admin/badges",  label: "manage badges" },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="rounded-xl border border-ink/10 bg-surface/60 px-4 py-3 text-center font-recoleta text-sm font-semibold text-ink hover:bg-surface/80 transition-colors"
            >
              {label} →
            </a>
          ))}
        </div>
      </div>

      {/* Social content helper */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-recoleta text-xs font-semibold uppercase tracking-widest text-ink-muted">
            social content
          </p>
          <CopyButton text={socialText} />
        </div>
        <div className="rounded-xl border border-ink/10 bg-surface/40 p-4">
          <pre className="whitespace-pre-wrap font-recoleta text-sm text-ink leading-relaxed">
            {socialText}
          </pre>
        </div>
      </div>
    </div>
  );
}
