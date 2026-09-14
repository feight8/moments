import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/plus";
import { badgeReason } from "@/lib/badgeDisplay";
import BadgeFormWithRefresh from "./_components/BadgeFormWithRefresh";
import BadgeRowActions from "./_components/BadgeRowActions";

interface BadgeRow {
  id: string;
  name: string;
  description: string;
  emoji: string;
  icon_url: string | null;
  condition_type: string;
  condition_value: number | null;
  condition_meta: Record<string, string> | null;
  is_active: boolean;
  sort_order: number;
  earnedCount: number;
}

async function getBadgesWithCounts(): Promise<BadgeRow[]> {
  const client = createServiceClient();

  const { data: badges } = await client
    .from("badges")
    .select("*")
    .order("sort_order");

  const { data: earnedRows } = await client
    .from("user_badges")
    .select("badge_id");

  const countMap = new Map<string, number>();
  for (const row of earnedRows ?? []) {
    const r = row as { badge_id: string };
    countMap.set(r.badge_id, (countMap.get(r.badge_id) ?? 0) + 1);
  }

  return (badges ?? []).map((b) => ({
    ...(b as BadgeRow),
    earnedCount: countMap.get(b.id as string) ?? 0,
  }));
}

export default async function AdminBadgesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user.id)) {
    redirect("/");
  }

  const badges = await getBadgesWithCounts();

  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <a href="/admin" className="text-xs text-gold hover:underline">← Admin</a>
            <h1 className="text-2xl font-bold text-ink mt-1">Badges</h1>
            <p className="text-sm text-ink/60">{badges.length} badges · {badges.filter(b => b.is_active).length} active</p>
          </div>
        </div>

        <BadgeFormWithRefresh />

        {/* Badge table */}
        <div className="rounded-2xl border border-ink/10 bg-surface/60 overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 text-xs font-semibold uppercase tracking-wide text-ink/50 px-5 py-3 border-b border-ink/10 bg-surface/80">
            <span className="w-10"></span>
            <span>Badge</span>
            <span className="w-20 text-right">Condition</span>
            <span className="w-16 text-right">Earned by</span>
            <span className="w-20 text-right">Actions</span>
          </div>

          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 items-center px-5 py-3.5 border-b border-ink/5 last:border-0 ${
                !badge.is_active ? "opacity-40" : ""
              }`}
            >
              <span className="w-10 flex items-center justify-center">
                {badge.icon_url ? (
                  <img src={badge.icon_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <span className="text-2xl leading-none">{badge.emoji}</span>
                )}
              </span>

              <div className="min-w-0 pr-4">
                <p className="text-sm font-semibold text-ink truncate">{badge.name}</p>
                <p className="text-xs text-ink/50 truncate">{badge.description}</p>
              </div>

              <div className="w-20 text-right">
                <p className="text-xs text-ink/60 truncate" title={badgeReason({
                  conditionType: badge.condition_type,
                  conditionValue: badge.condition_value,
                  conditionMeta: badge.condition_meta,
                })}>
                  {badgeReason({
                    conditionType: badge.condition_type,
                    conditionValue: badge.condition_value,
                    conditionMeta: badge.condition_meta,
                  })}
                </p>
              </div>

              <div className="w-16 text-right">
                <span className="text-sm font-semibold text-ink">{badge.earnedCount}</span>
              </div>

              <div className="w-20 text-right">
                <BadgeRowActions id={badge.id} isActive={badge.is_active} />
              </div>
            </div>
          ))}

          {badges.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-ink/50">No badges yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
